import { useEffect, useState } from "react";
import ToggleButton from "./components/ToggleButton";
import "./css/index.css";
import EngineSelector from "./components/EngineSelector";
import config from "./conf/constants";
import RMP from "./components/RPM/RPM";
import WaterTemp from "./components/WaterTemp/WaterTemp";
import OilPressure from "./components/OilPressure/OilPressure";
import DEFLevel from "./components/Def/DEF";
import WaterInFuelIndicator from "./components/WaterInFuelIndicator/WaterInFuelIndicator";
import IFSelector from "./components/InterfaceSelector/IFSelector";
import CANListener from "./components/CANListener/CANListener";
import PGNDataComponent from "./components/PGNData/PGNData";
import CommandPrompt from "./components/CommandPrompt/CommandPrompt";
import DistanceTracker from "./components/Distance/Distance";

const App = () => {
  const [selectedPGNs, setSelectedPGNs] = useState([]);
  // const [filteredPGNData, setFilteredPGNData] = useState({});

  const [pgnData, setPgnData] = useState({});
  const [sourceAddress, setSelectedSourceAddress] = useState([]);
  const [sourceAddresses, setSourceAddresses] = useState([]);
  const [selectedInterface, setSelectedInterface] = useState(""); // Track selected interface
  const [isOn, setIsOn] = useState(false);
  const [command, setCommand] = useState(null);
  const [selectedEngine, setSelectedEngine] = useState("");
  const [response, setResponse] = useState(null);

  // Update filteredPGNData whenever selectedPGNs or pgnData changes
  // useEffect(() => {
  //   const newFilteredData = Object.fromEntries(Object.entries(pgnData).filter(([pgn]) => selectedPGNs.includes(pgn)));
  //   setFilteredPGNData(newFilteredData);
  // }, [pgnData, selectedPGNs]);

  useEffect(() => {
    const now = new Date();
    const formattedTime = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}:${now.getHours()}:${now.getMinutes()}`;
    const sendCommand = async () => {
      try {
        const res = await fetch(`${config.API_BASE_URL}${config.COMMANDS_ENDPOINT}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ command }),
        });

        const data = await res.json();
        if (res.ok) {
          setResponse(`${formattedTime} :OK -> ${data.response}`);
          console.log(`${formattedTime} : Success: ${data.response}`);
        } else {
          console.log("Error reading response: ", data.error);
          setResponse(`${formattedTime} : Error reading response: ${data.error}`);
        }
      } catch (error) {
        setResponse(`${formattedTime} :Error sending command: ${error}`);
      }
    };

    if (command) {
      sendCommand();
    }
  }, [command]);

  function handleStartOff() {
    setIsOn((prevState) => !prevState);
  }

  return (
    <div className="container">
      <div className="left-column">
        {
          //Header for logo and CAN interfaces start section
        }
        <div class="container-header">
          <div>
            <img src="/images/csu-logo.jpg" alt="CSU Logo" />
          </div>
          <div>
            <img src="/images/cummins-logo.png" alt="Cummins Logo" />
          </div>
          <span>Engine Module Test Bench</span>
          <div style={{ borderLeft: "2px solid #ddd", height: "60px", margin: "0 10px" }} />
          <IFSelector selectedInterface={selectedInterface} setSelectedInterface={setSelectedInterface} />
          <div style={{ borderLeft: "2px solid #ddd", height: "60px", margin: "0 10px" }} />
          <ToggleButton isOn={isOn} handleStartOff={handleStartOff} setCommand={setCommand} />

          <EngineSelector selectedEngine={selectedEngine} setSelectedEngine={setSelectedEngine} ecuStatus={isOn} />
        </div>
        {
          //Header for logo and CAN interfaces end section
        }
        <div>
          <h2>ECU: {selectedEngine} </h2>
        </div>
        {
          // Gauges and instruments start section
        }
        <div className="gauge-container">
          <div className="gauge-item">
            <RMP selectedInterface={selectedInterface} />
          </div>
          <div className="gauge-item">
            <WaterTemp selectedInterface={selectedInterface} />
          </div>
          <div className="gauge-item">
            <OilPressure selectedInterface={selectedInterface} />
          </div>
          <div className="gauge-item">
            <DEFLevel selectedInterface={selectedInterface} />
          </div>
          <div className="gauge-item">
            <WaterInFuelIndicator />
          </div>
          <div className="gauge-item">
            <DistanceTracker />
          </div>
        </div>
        {
          // Gauges and instruments end section
        }
        {
          //CAN Data Section start section
        }
        <div className="can-data-section">
          <div className="can-data-section-left-column">
            <CANListener selectedInterface={selectedInterface} sourceAddresses={sourceAddresses} setSourceAddresses={setSourceAddresses} setSelectedSourceAddress={setSelectedSourceAddress} />
          </div>
          <div className="can-data-section-right-column">
            {/* <div style={{ display: "flex", height: "100vh" }}> */}
            {/* <div style={{ flex: 2, padding: "10px", borderRight: "1px solid #ddd" }}> */}
            <PGNDataComponent
              pgnData={pgnData}
              setPgnData={setPgnData}
              sourceAddress={sourceAddress}
              selectedPGNs={selectedPGNs}
              setSelectedPGNs={setSelectedPGNs}
              selectedInterface={selectedInterface}
            />
            {/* </div> */}
            {/* </div> */}
          </div>
        </div>
        {
          //CAN Data Section end section
        }
        {
          // Fixed bottom command prompt section
        }
      </div>
      <CommandPrompt setCommand={setCommand} response={response} />
    </div>
  );
};

export default App;
