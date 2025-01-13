import React, { useState, useEffect } from "react";
import GaugeChart from "react-gauge-chart";
import { SocketContext } from "../conf/SocketContext";

const TemperatureGauge = () => {
  const socket = useState(SocketContext);
  const [temperature, setTemperature] = useState(0);

  // Function to convert temperature to percentage for the gauge
  const temperatureToPercent = (temp) => {
    const minTemp = -40;
    const maxTemp = 215;
    return (temp - minTemp) / (maxTemp - minTemp);
  };

  useEffect(() => {
    // Connect to the server and listen for temperature updates
    socket.on("temperature_update", (data) => {
      const { temperature } = data;
      console.log("Received temperature update: " + temperature + "°C");
      setTemperature(temperature); // Update the temperature state
    });

    // Clean up the event listener on component unmount
    return () => {
      socket.off("temperature_update");
    };
  }, [socket]); // Empty dependency array means this runs once when the component mounts

  return (
    <div
      style={{
        textAlign: "center",
        margin: "20px",
        width: "230px",
        fontSize: "12px",
      }}
    >
      <h2>Engine Coolant Temp: SPN-110</h2>
      <GaugeChart
        id="temperature-gauge"
        nrOfLevels={30}
        percent={temperatureToPercent(temperature)}
        colors={["#1e90ff", "#ff6347"]}
        arcWidth={0.3}
        arcPadding={0.02}
        formatTextValue={() => `${temperature}°C`}
        textColor="#000"
        style={{ width: "250px", height: "100px" }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "0 10px",
          marginTop: "5px",
          width: "230px",
        }}
      >
        <span>C</span>
        <span>H</span>
      </div>
    </div>
  );
};

export default TemperatureGauge;

// import React, { useState } from "react";
// import GaugeChart from "react-gauge-chart";

// const TemperatureGauge = () => {
//   const [temperature, setTemperature] = useState(0);

//   const temperatureToPercent = (temp) => {
//     const minTemp = -40;
//     const maxTemp = 215;
//     return (temp - minTemp) / (maxTemp - minTemp);
//   };

//   return (
//     <div style={{ textAlign: "center", margin: "20px" }}>
//       <h2>Engine Temperature</h2>
//       <GaugeChart
//         id="temperature-gauge"
//         nrOfLevels={30}
//         percent={temperatureToPercent(temperature)}
//         colors={["#1e90ff", "#ff6347"]}
//         arcWidth={0.3}
//         arcPadding={0.02}
//         formatTextValue={() => `${temperature}°C`}
//       />
//       <input
//         type="range"
//         min="-40"
//         max="215"
//         value={temperature}
//         onChange={(e) => setTemperature(e.target.value)}
//         style={{ width: "80%", marginTop: "20px" }}
//       />
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           padding: "0 10px",
//         }}
//       >
//         <span>C</span>
//         <span>H</span>
//       </div>
//     </div>
//   );
// };

// export default TemperatureGauge;
