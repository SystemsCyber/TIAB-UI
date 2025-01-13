import React, { useContext, useEffect, useState } from "react";
import { SocketContext } from "../../conf/SocketContext";

const DistanceTracker = () => {
  const socket = useContext(SocketContext);
  const [tripDistance, setTripDistance] = useState(0);
  const [totalVehicleDistance, setTotalVehicleDistance] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    //const socket = socketIOClient(ENDPOINT);

    // Request distances from the server
    //socket.emit("distance_update");

    // Listen for distance updates
    socket.on("distance_update", (data) => {
      setTripDistance(data.trip_distance);
      setTotalVehicleDistance(data.total_vehicle_distance);
    });

    // Handle errors
    socket.on("error", (err) => {
      setError(err.message);
    });

    // Cleanup on component unmount
    return () => {
      socket.off("distance_update");
    };
  }, [socket]);

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Vehicle Distance Tracker</h1>
      {error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
            Trip Distance: <span>{tripDistance} km</span>
          </p>
          <p style={{ fontSize: "18px", fontWeight: "bold" }}>
            Total Vehicle Distance: <span>{totalVehicleDistance} km</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default DistanceTracker;
