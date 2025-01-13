import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import { Slider, Typography } from "antd";
import config from "../conf/constants";
const { Title } = Typography;

const socket = io(`${config.API_BASE_URL}`, {
  transports: ["websocket"],
}); // Replace with your Flask app's URL

const AppSlider = () => {
  const [voltage, setVoltage] = useState(0);
  function connectToServer() {
    socket.on("connect", () => {
      console.log("Connected to server 5000");
    });
  }
  useEffect(() => {
    // Establish a connection to the server
    connectToServer();
    // Clean up the socket connection on component unmount
  }, []);

  const handleChange = (value) => {
    const newVoltage = value.toFixed(2); // limit voltage to 2 decimal places
    setVoltage(newVoltage);

    // Emit the new voltage value to the server
    socket.emit("voltage_update", { voltage: newVoltage });
  };

  return (
    <div style={{ padding: "5px", textAlign: "center" }}>
      <Title level={4}>Voltage: {voltage}V</Title>
      <Slider
        vertical
        min={0}
        max={5}
        step={0.01} // Step size for finer control
        defaultValue={0}
        value={parseFloat(voltage)}
        onChange={handleChange}
        style={{ height: 100 }} // Adjust the height as needed
        tooltip={{ open: true }} // Updated tooltip prop
      />
    </div>
  );
};

export default AppSlider;
