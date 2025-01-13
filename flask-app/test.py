import struct

hex_value = 0x61a400

little_endian = struct.pack('<I',  hex_value)

little_endian = little_endian + b'\xFF' * 5

list_hex = [byte for byte in little_endian]


# little_endian_hex = ''.join(f'{byte:02x}' for byte in little_endian)

# print(f"Little endian: {little_endian}")
print(f"Little endian hex: {list_hex}")
