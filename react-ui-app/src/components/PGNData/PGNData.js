import React, { useContext, useEffect, useState } from "react";
import Tooltip from "../Tooltip/Tooltip";
import { SocketContext } from "../../conf/SocketContext";

const PGNDataComponent = ({ sourceAddress, pgnData, setPgnData, /*selectedPGNs, setSelectedPGNs,*/ selectedInterface }) => {
  const socket = useContext(SocketContext);
  const [sourceDesc, setSourceDesc] = useState("");

  const hexToBinary = (hex) => {
    if (hex.length !== 2) {
      throw new Error("Input must be two characters representing a byte");
    }
    return parseInt(hex, 16).toString(2).padStart(8, "0");
  };

  // Function to format the bit string
  const formatBitString = (spns, bitString, byteIndex) => {
    const byteStartBit = byteIndex * 8;
    const byteEndBit = byteStartBit + 7;

    // Filter SPNs that start within the current byte
    const relevantSPNs = spns.filter((spn) => spn.spnstartbit >= byteStartBit && spn.spnstartbit < byteEndBit + 1);

    const formattedBits = [];
    let currentIndex = 0;

    // Iterate over relevant SPNs
    relevantSPNs.forEach((spn) => {
      const spnStart = spn.spnstartbit - byteStartBit;
      const spnEnd = spnStart + spn.spnlen;

      // Add bits before the current SPN (unformatted)
      if (currentIndex < spnStart) {
        formattedBits.push(bitString.slice(currentIndex, spnStart));
      }

      // Add bits for the current SPN (formatted with Tooltip)
      formattedBits.push(
        <Tooltip
          content={
            <>
              <strong>Description:</strong> {spn.description}
              <br />
              <strong>SPN:</strong> {spn.spn}
              <br />
              <strong>Bit Length:</strong> {spn.spnlen} bits
              <br />
              <strong>Parameter Value:</strong>
            </>
          }
          key={spn.spn}
        >
          <span style={{ color: getColor(spn.spn) }}>{bitString.slice(spnStart, spnEnd)}</span>
        </Tooltip>
      );

      currentIndex = spnEnd;
    });

    // Add any remaining bits after the last SPN (unformatted)
    if (currentIndex < bitString.length) {
      formattedBits.push(bitString.slice(currentIndex));
    }

    return formattedBits;
  };
  // Helper function to generate a color based on SPN (or other criteria)
  const getColor = (spn) => {
    const colors = ["red", "blue", "green", "purple", "orange", "brown", "pink", "cyan"];
    return colors[spn % colors.length]; // Cycle through colors
  };

  useEffect(() => {
    // Reset pgnData when sourceAddress changes
    setPgnData({});
    // Listen for incoming data from the server
    socket.on("can_data", (data) => {
      const { pgn, timestamp, source_address, source_description, can_id_hex, payload, spns, ...rest } = data;

      // Filter messages based on the specific source address
      if (source_address !== sourceAddress) return;
      setSourceDesc(source_description);
      setPgnData((prevPgnData) => {
        const prevData = prevPgnData[pgn] || { count: 0, lastTimestamp: 0, period: 0 };
        const period = prevData.lastTimestamp ? timestamp - prevData.lastTimestamp : 0;

        return {
          ...prevPgnData,
          [pgn]: {
            ...rest,
            count: prevData.count + 1,
            period,
            lastTimestamp: timestamp,
            can_id_hex: can_id_hex,
            source_description: source_description,
            payload,
            spns,
          },
        };
      });
    });

    // Clean up the event listeners on component unmount
    return () => {
      socket.off("can_data");
    };
    // Clean up the socket connection on component unmount
    // return () => {
    //   if (socket.current) {
    //     socket.current.disconnect();
    //   }
    // };
  }, [sourceAddress, setPgnData, socket, selectedInterface]);

  return (
    <div>
      <h5>
        PGNs and SPNs for: {sourceDesc} ({sourceAddress})
      </h5>
      <table className="fancy-table">
        <thead>
          <tr>
            <th>PGN</th>
            <th>CAN ID</th>
            <th>Description</th>
            <th>Count</th>
            <th>Period (ms)</th>
            <th>B1</th>
            <th>B2</th>
            <th>B3</th>
            <th>B4</th>
            <th>B5</th>
            <th>B6</th>
            <th>B7</th>
            <th>B8</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(pgnData).map(([pgn, { pgn_description, count, period, can_id_hex, payload, spns }]) => (
            <tr key={pgn}>
              <td>{pgn}</td>
              <td>
                0x<span style={{ textAlign: "left", textTransform: "uppercase" }}>{`${can_id_hex.slice(2).toUpperCase()}`}</span>
              </td>
              <td style={{ textAlign: "left" }}>{pgn_description}</td>
              <td>{count}</td>
              <td>{period.toFixed(2)}</td>
              {payload.map((byte, byteIndex) => (
                <td style={{ width: "60px", borderRight: "1px solid #ccc", borderLeft: "1px solid #ccc" }} key={byteIndex}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div>{byte.slice(2).toUpperCase()}</div>
                    <div>
                      <span style={{ fontSize: "0.9rem", fontFace: "bold" }}>{formatBitString(spns, hexToBinary(byte.slice(2)), byteIndex)}</span>
                    </div>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Inline CSS styles for table headers and cells
// const headerStyle = {
//   padding: "8px",
//   backgroundColor: "#f2f2f2",
//   fontWeight: "bold",
//   textAlign: "center",
//   color: "green",
// };

// const cellStyle = {
//   padding: "8px",
//   backgroundColor: "#ffffff",
//   border: "1px solid #ddd",
// };

export default PGNDataComponent;
