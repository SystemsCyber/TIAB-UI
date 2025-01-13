import React, { useState, useEffect, useContext } from "react";
import waterInFuelIcon from "./images/waterInFuel.png";
import { SocketContext } from "../../conf/SocketContext";

const WaterInFuelIndicator = () => {
  const socket = useContext(SocketContext);
  const [waterStatus, setWaterStatus] = useState({ message: "No water detected.", status: false });
  //   const [isActive, setIsActive] = useState(false); // Condition to control the timer
  //   const [counter, setCounter] = useState(0); // Example counter to show the timer effect
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Track if the timer is running

  useEffect(() => {
    // Listen for the water in fuel status updates from the server
    socket.on("water_in_fuel_update", (data) => {
      const { message, status } = data;
      //   console.log("Received Water in Fuel Status: " + status + ", Message: " + message);

      setWaterStatus(status);

      // If "Water detected in fuel" is received, start the timer
      if (status) {
        setWaterStatus({ message, status });
        setIsTimerRunning(true); // Start the 1-second display timer
      } else if (!isTimerRunning) {
        // Only update to "No water detected" if the timer is not running
        setWaterStatus({ message: "No water detected.", status: false });
      }
      //setWaterStatus(status); // Update the water status state
    });

    // Clean up the event listeners on component unmount
    return () => {
      socket.off("water_in_fuel_update");
    };
  }, [isTimerRunning, socket]); // Empty dependency array means this runs once when the component mounts

  useEffect(() => {
    let timer;

    if (isTimerRunning) {
      // Set a timeout for 1 second to reset the timer
      timer = setTimeout(() => {
        setIsTimerRunning(false); // Stop the timer
        setWaterStatus({ message: "No water detected.", status: false }); // Revert status after 1 second
      }, 1000);
    }

    // Clear the timer if the component unmounts or dependencies change
    return () => clearTimeout(timer);
  }, [isTimerRunning]); // Dependency on `isTimerRunning`

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "20px" }}>
      {waterStatus.status ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <img src={waterInFuelIcon} alt={waterStatus.message} style={{ width: "80px", marginBottom: "10px" }} />
          <p style={{ color: "red", fontWeight: "bold", fontSize: "18px" }}>{waterStatus.message}</p>
        </div>
      ) : (
        <p style={{ color: "green", fontSize: "18px", textAlign: "center" }}>{waterStatus.message}</p>
      )}
    </div>
  );
};

export default WaterInFuelIndicator;
