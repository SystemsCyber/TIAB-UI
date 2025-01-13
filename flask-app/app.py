import time, asyncio
from flask import Flask, abort, json, jsonify, request, send_from_directory
from flask_socketio import SocketIO
from flask_cors import CORS
import can, os, serial, threading, subprocess, struct, sys
from enum import Enum

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", ping_interval=25, ping_timeout=60)
global_teensy_serial = None
current_interface = "" # Store the selected CAN interface globally
can_thread = None
can_running = False
bus = None

# Define the directory where engine files are stored
ENGINE_FOLDER = "./engines"

# Define the path to your file
file_path = 'J1939db.json'

# Check if the file exists and handle the error gracefully
try:
    if not os.path.exists(file_path):
        raise FileNotFoundError
    # Load the J1939 database from the JSON file
    with open(file_path, 'r') as f:
        j1939_db = json.load(f)
        sa_table = j1939_db.get("J1939SATabledb", {})
except FileNotFoundError:
    print(f"Error: The file '{file_path}' (Digital Annex - Contact SAE for a license) is missing. Please ensure the file is available.\nApplication terminated.")
    sys.exit(1)

# # Load the J1939 database from JSON file
# with open('J1939db.json', 'r') as f:
#     j1939_db = json.load(f)
#     sa_table = j1939_db.get("J1939SATabledb", {})

class J1939Item(Enum):
    SPN = "SPN"
    PGN = "PGN"


# Setup the CAN interface
# can_interface = "vcan0"
# bus = can.interface.Bus(can_interface, interface='socketcan')
# pgn_65262 = 0xFEEE  # Engine Temperature 1 PGN
# source_address = 0x00  # Source Address for Engine (ECM)

isReadingCAN = False

def parse_spn244_spn245_vehicle_distance(data):
    """
    Parse Trip Distance (SPN 244) and Total Vehicle Distance (SPN 245) from the CAN data.
    Args:
        data (bytes): 8-byte CAN message payload from PGN 65248.
    Returns:
        dict: Parsed distances with keys 'trip_distance' and 'total_vehicle_distance'.
    """

    # Scaling factor and offset for distances (J1939 standard)
    SCALING_FACTOR = 0.125  # 0.125 km per bit
    OFFSET = 0.0           # 0 km offset
    if len(data) != 8:
        raise ValueError("CAN data must be exactly 8 bytes for PGN 65248.")
    
    # Extract Trip Distance (bytes 1-4) and Total Vehicle Distance (bytes 5-8)
    trip_distance_raw = struct.unpack_from('<I', data, 0)[0]  # Little-endian 4 bytes
    total_vehicle_distance_raw = struct.unpack_from('<I', data, 4)[0]  # Little-endian 4 bytes

    # Calculate distances using the scaling factor and offset
    trip_distance = trip_distance_raw * SCALING_FACTOR + OFFSET
    total_vehicle_distance = total_vehicle_distance_raw * SCALING_FACTOR + OFFSET

    return {
        'trip_distance': round(trip_distance, 3),  # Round to 3 decimal places
        'total_vehicle_distance': round(total_vehicle_distance, 3)
    }

def convert_spn110_to_temperature(raw_data):
    """Convert raw SPN 110 data to temperature in Celsius."""
    # SPN 110 has a scale of 1 °C per bit and an offset of -40 °C
    raw_value = int(raw_data)  # Assuming `raw_data` is a single byte value
    temperature = raw_value * 1 + (-40)  # Scale factor of 1 and offset of -40
    return round(temperature, 2)
        
def convert_spn190_to_rpm(raw_data):
    """Convert raw SPN 190 data to engine speed (RPM)."""
    #raw_value = int.from_bytes(raw_data, byteorder='little'
    #print(f"B1: {raw_data[0]}, B2: {raw_data[1]}")
    #raw_value = raw_data[0] << 8 | raw_data[1]
    raw_value = raw_data[1] << 8 | raw_data[0]
    rpm = raw_value * 0.125  # Scale factor of 0.125 RPM per bit
    #print(f"SPN 2 bytes: {raw_data}, RPM: {rpm}")
    time.sleep(0.1)
    return round(rpm, 0)

def convert_spn1761_to_def_level(raw_data):
    """Convert raw SPN 1761 data to DEF tank level percentage."""
    raw_value = int(raw_data)  # Extract byte 1 for SPN 1761
    # Scale is 0.4% per bit, offset is 0%
    def_level = raw_value * 0.4
    # If raw_value is 0xFB, the data is invalid
    if raw_value == 0xFB:
        return "Invalid Measurement"
    return round(def_level, 2)  # Return DEF level in percentage

def convert_spn100_to_oil_pressure(raw_data): # Function to convert SPN 100 data to oil pressure in kPa
    """Convert raw SPN 100 data to oil pressure in kPa."""
    raw_value = int(raw_data)  # Extract byte 2 for SPN 100
    oil_pressure = raw_value * 4  # Scale factor of 4 kPa per bit
    return oil_pressure
def interpret_water_in_fuel_indicator(raw_data):
    """Convert raw SPN 97 data to a readable water-in-fuel status."""
    # Extract the 2 bits for SPN 97 (Water in Fuel Indicator)
    indicator_bits = (raw_data >> 6) & 0b11  # Using bits 0 and 1
    if indicator_bits == 0b00:
        return {"message": "No water in fuel", "status": False}
    elif indicator_bits == 0b01:
        return {"message": "Water detected in fuel", "status": True}
    elif indicator_bits == 0b10:
        return {"message": "Error", "status": False}
    elif indicator_bits == 0b11:
        return {"message": "Not available", "status": False}
    
def get_details(J1939_data_item, J1939_data_item_type):
    """Retrieve PGN details from the J1939 database."""
    j1939data = {"SPN":"J1939SPNdb", "PGN":"J1939PGNdb"}
    J1939_data_item_str = str(J1939_data_item)
    return j1939_db.get(j1939data[J1939_data_item_type], {}).get(J1939_data_item_str, {})

# API to get the CAN interface
def get_can_interfaces():
    """Get a list of CAN interfaces available on the system."""
    can_interfaces = []
    result = subprocess.run(['ip', 'link', 'show'], stdout=subprocess.PIPE)
    output = result.stdout.decode('utf-8')

    for line in output.split('\n'):
        if ('can' in line or 'vcan' in line) and ':' in line:
            parts = line.split(':')
            if len(parts) > 1:
                iface = parts[1].strip()
                can_interfaces.append(iface)
    return can_interfaces

# API to set the CAN interface
@app.route('/interface/set', methods=['POST'])
def set_interface():
    global current_interface, can_thread, can_running, bus
    
    # Get the interface from the request
    data = request.get_json()
    new_interface = data.get("interface")

    

    if new_interface and new_interface != current_interface:
        print("===== Interface 1: ", new_interface)
        # Stop the current thread if running
        if can_running:
            can_running = False
            # if bus is not None:
            #     bus.shutdown()  # Close the old bus connection
            print("===== Interface 2: ", new_interface)
            if can_thread and can_thread.is_alive():
                print("===== Interface 3: ", new_interface)
                can_thread.join()

        # Update the interface
        current_interface = new_interface
        
        # Short pause to ensure the old interface is stopped
        #time.sleep(2)
        
        # Start a new CAN reading thread
        can_thread = threading.Thread(target=can_read_loop)
        can_thread.start()

    return jsonify({"interface": current_interface})

# API to returns list of can channels on the system
@app.route('/interfaces', methods=['GET'])
def get_channels():
    channels = get_can_interfaces()
    return jsonify({"interfaces": channels})

def can_read_loop():
    global can_running, current_interface, bus
    can_running = True
    # Setup the CAN interface
    #can_interface = "vcan0"
    if not current_interface:
        print("Error: No CAN interface specified. Please set current_interface to a valid interface name.")
        can_running = False
        return
    try:
        bus = can.interface.Bus(current_interface, interface='socketcan')
        print(f"Listening for CAN data on interface {current_interface}...")

            
        while can_running:
            # print("Reading....")
            message = bus.recv()  # Blocking read
           
            if message:
                # Filter based on PGN 65262 (associated with Engine Temperature 1)
                pgn = (message.arbitration_id >> 8) & 0x3FFFF  # Extract PGN from arbitration ID

                j1939_details = get_details(pgn, J1939Item.PGN.name)
                spns = j1939_details.get("SPNs", [])

                if j1939_details:
                    # Extract relevant data
                    can_id = message.arbitration_id
                    source_address = can_id & 0xFF
                    sa_description = sa_table.get(str(source_address), f"Unknown ({source_address})")
                    spns_details = {
                        "spns" : j1939_details.get("SPNs", []),
                        "spnstartbits" : j1939_details.get("SPNStartBits", []),
                    }


                    # Prepare data structure to send
                    data = {
                        "source_address": source_address,
                        "source_description": sa_description,  # from code
                        "can_id": message.arbitration_id, # from code
                        "can_id_hex": hex(message.arbitration_id), # from code
                        "pgn": pgn, # From code
                        "timestamp": message.timestamp,
                        "payload": [f"0x{byte:02x}" for byte in message.data],
                        "pgn_description": j1939_details["Name"],
                        "spns": [
                            {
                                "spn": spn, 
                                "spnstartbit": spnstartbit,
                                "description": get_details(spn, J1939Item.SPN.name)['Name'], 
                                "spnlen": get_details(spn, J1939Item.SPN.name)['SPNLength'], 
                            } 
                            for spn, spnstartbit in zip(spns_details["spns"], spns_details["spnstartbits"])]
                    }


                    # Emit structured data
                    # print(f"Received on {current_interface}: {data}")
                    socketio.emit('can_data', data)
                
                if pgn == 65262:
                    # Check if SPN 110 (Engine Coolant Temperature) is in the message
                    # Assuming SPN 110 data is in the first byte of message.data based on the description
                    raw_data = message.data[0] 
                    temperature = convert_spn110_to_temperature(raw_data)
                    
                    if temperature is not None:
                        # print(f"Emitted Temperature from CAN data (SPN 110): {temperature} °C")
                        socketio.emit('temperature_update', {'temperature': temperature})
                elif pgn == 65248: # Check Trip and Total vehicle distance
                    distance_data = parse_spn244_spn245_vehicle_distance(message.data)
                    if distance_data is not None:
                        # print(f"Distance data: {distance_data}")
                        socketio.emit('distance_update', distance_data);
                elif pgn == 61444:
                    raw_data = message.data[3:5]  # Bytes 4 and 5 for RPM

                    # print(f"The data is: {message.arbitration_id} {message.data}, Raw data: {raw_data}")
                    rpm = convert_spn190_to_rpm(raw_data)
                    if rpm is not None:
                        #print(f"Emitted RPM from CAN data (SPN 190): {rpm} RPM")
                        socketio.emit('rpm_update', {'rpm': rpm})
                        
                
                elif pgn == 65110: # Check for PGN 65110 (Aftertreatment 1 DEF Tank Level)
                    # Byte 1 is used for SPN 1761 (DEF Tank Level)
                    raw_data = message.data[0]  # Extract byte 1 for SPN 1761
                    def_level = convert_spn1761_to_def_level(raw_data)
                    
                    if def_level != "Invalid Measurement":
                        # print(f"Emitted DEF Tank Level: {def_level}%")
                        socketio.emit('def_level_update', {'def_level': def_level})
                    else:
                        print("DEF Level data is not valid.")
                
                elif pgn == 65263: # Check for PGN 65263 (Engine Fluid Level/Pressure 1)
                    # Byte 2 is used for SPN 100 (Engine Oil Pressure)
                    raw_data = message.data[3]  # Extract byte 2 for SPN 100
                    oil_pressure = convert_spn100_to_oil_pressure(raw_data)

                    # print(f"Debug - Arbitration ID: {message.arbitration_id} (Hex: {hex(message.arbitration_id)}), Extracted PGN: {pgn} (Hex: {hex(pgn)})")
                    
                    # print(f"Emitted Engine Oil Pressure [{message.arbitration_id, pgn}]: {oil_pressure} kPa")
                    socketio.emit('oil_pressure_update', {'oil_pressure': oil_pressure})

                elif pgn == 65279:  # PGN 65279 for Water in Fuel Indicator
                    # Extract byte 1 (SPN 97) for Water in Fuel Indicator data
                    raw_data = message.data[0]
                    water_in_fuel_status = interpret_water_in_fuel_indicator(raw_data)
                    # print(f"Debug - Arbitration ID: {message.arbitration_id} (Hex: {hex(message.arbitration_id)}), Extracted PGN: {pgn} (Hex: {hex(pgn)})")
                    # print(f"Emitted Water in Fuel Status [{message.arbitration_id}, {pgn}]: {water_in_fuel_status}")
                    socketio.emit('water_in_fuel_update', water_in_fuel_status)
    except Exception as e:
        print(f"Error in CAN read loop: {e}")
        can_running = False


@app.route('/api/sss2/set/default', methods=['GET'])
def set_default_values():
    pass

@app.route('/api/sss2/set/current', methods=['GET'])
def set_dcurrent_values():
    pass

@app.route('/api/sss2/get/status/all', methods=['GET'])
def get_current_status_values():
    pass


@app.route('/api/engines', methods=['GET'])
def get_engine_types():
    try:
        # List all files in the engine directory with `.txt` extension
        engine_files = [f.replace('.txt', '') for f in os.listdir(ENGINE_FOLDER) if f.endswith('.txt')]
        return jsonify({"engineTypes": engine_files}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/engines/<engine_name>.txt', methods=['GET'])
def get_engine_file(engine_name):
    try:
        # Serve the engine file from the directory
        return send_from_directory(ENGINE_FOLDER, f"{engine_name}.txt")
    except FileNotFoundError:
        abort(404, description="Engine file not found")
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/engines/images/<filename>')
def serve_image(filename):
    # Serve image files from the 'images' directory
    return send_from_directory('engines/images', filename)


# @app.route('/status')
# def index():
#     global isReadingCAN
#     status = "active" if isReadingCAN else "not active"
#     return {"isReadingCAN": "CAN reader " + status}

@app.route('/api/cmd', methods=['POST'])
def send_command():
    global global_teensy_serial  # Declare global variable
    if global_teensy_serial is None:
        global_teensy_serial = connect_to_teensy()

    if global_teensy_serial is None:
        return jsonify({'error': 'Failed to connect to Teensy'}), 500

    command = request.json.get('command')  # Get command from JSON payload
    if command:
        try:
            # Replace escaped \n with the actual newline character
            command = command.replace('\\n', '\n')
            global_teensy_serial.write(command.encode('utf-8'))
            time.sleep(0.3)
            # return jsonify({'status': 'Command sent', 'command': command}), 200
             # Read the response from Teensy
            feedback = read_response()
            print(f"==== {repr(command)} -> {repr(feedback['response'])}")
            return feedback
        except Exception as e:
            return jsonify({'error': f'Failed to send command: {str(e)}'}), 500
    else:
        return jsonify({'error': 'No command provided'}), 400

def connect_to_teensy():
    try:
        # Establish serial connection to Teensy on COM11
        teensy_serial = serial.Serial('/dev/ttyACM0', 9600, timeout=1)
        return teensy_serial
    except serial.SerialException as e:
        print(f"Error connecting to Teensy: {e}")
        return None

# Route to read response from Teensy
def read_response():
    global global_teensy_serial  # Declare global variable
    if global_teensy_serial is None:
        global_teensy_serial = connect_to_teensy()

    if global_teensy_serial is None:
        return jsonify({'error': 'Failed to connect to Teensy'}), 500

    try:
        response = global_teensy_serial.readline().decode('utf-8').strip()
        return jsonify({'response': response if response else 'No response'}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to read response: {str(e)}'}), 500
# @app.route('/start')
# def start_reading_can():
#     global isReadingCAN, can_task
#     if not isReadingCAN:
#         isReadingCAN = True
#         # Start the background task for reading CAN data
#         can_task = socketio.start_background_task(can_read_loop)
#     return jsonify({"isReadingCAN": "CAN reader Running"})

# @app.route('/stop')
# def stop_reading_can():
#     global isReadingCAN, can_task
#     isReadingCAN = False
#     can_task = None
#     return jsonify({"isReadingCAN": "CAN reader Stopped"})


# def voltage_to_temperature(voltage):
#     min_voltage = 0.0
#     max_voltage = 5.0
#     min_temp = -40.0
#     max_temp = 215.0
#     temperature = min_temp + ((voltage - min_voltage) / (max_voltage - min_voltage)) * (max_temp - min_temp)
#     return round(temperature, 2)


# def encode_temperature_to_spn110(temperature):
#     raw_value = int(temperature + 40)
#     raw_value = max(0, min(255, raw_value))  # Ensure it stays within byte range
#     return raw_value


# def send_can_message(temperature):
#     global bus
#     # Convert the temperature to J1939 SPN 110 format
#     spn110_value = encode_temperature_to_spn110(temperature)
    
#     # Prepare the data bytes for PGN 65262
#     data = [
#         spn110_value,  # SPN 110 (Engine Coolant Temperature)
#         0xFF, 0xFF, 0xFF,  # Unused bytes
#         0xFF, 0xFF, 0xFF, 0xFF  # Total 8 bytes as per J1939 standard
#     ]

#     # Build the 29-bit identifier according to J1939 standards
#     priority = 3
#     dp = 0
#     pf = 0xFE  # PDU Format for PGN 65262
#     ps = 0x00  # Broadcast (Group Extension)
#     extended_id = (priority << 26) | (dp << 25) | (pf << 16) | (ps << 8) | source_address

#     # Set up the CAN bus
#     #bus = can.interface.Bus(channel=can_interface, bustype='socketcan')
#     message = can.Message(arbitration_id=extended_id, data=data, is_extended_id=True)
    
#     try:
#         # Send the CAN message
#         bus.send(message)
#         print(f"Sent CAN message: PGN 65262, Temp: {temperature}°C -> ID: {hex(extended_id)}, Data: {data}")
#     except can.CanError:
#         print("Failed to send CAN message")
#     # finally:
#     #     bus.shutdown()
                                                                                                            
# Health check
@app.route('/hello')
def hello_world():
    return jsonify({"status": "Alive!"})
@socketio.on('connect')
def handle_connect():
    print("Client connected")

# @socketio.on('voltage_update')
# def handle_voltage_update(data):
#     voltage = data['voltage']
#     temperature = voltage_to_temperature(float(voltage))
#     print(f"Received voltage: {voltage}V, Mapped temperature: {temperature}°C")
#     # Send the data over CAN
#     send_can_message(temperature)
# def voltage_to_temperature(voltage):
#     # Ensure voltage is a float
#     voltage = float(voltage)
    
#     # Define the voltage and temperature ranges
#     min_voltage = 0.0
#     max_voltage = 5.0
#     min_temp = -40.0
#     max_temp = 215.0

#     # Calculate temperature based on voltage
#     temperature = min_temp + ((voltage - min_voltage) / (max_voltage - min_voltage)) * (max_temp - min_temp)
#     return round(temperature, 2)

can_thread = threading.Thread(target=can_read_loop)
can_thread.start()

if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)