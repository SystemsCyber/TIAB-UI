import React, { useState, useEffect } from "react";
import config from "../conf/constants";

const EngineSelector = ({ ecuStatus, setSelectedEngine, selectedEngine }) => {
  const [engineTypes, setEngineTypes] = useState([]);

  const [engineImage, setEngineImage] = useState(null);
  // const [commands, setCommands] = useState([]);

  // Fetch engine types on component mount
  useEffect(() => {
    fetch(`${config.API_BASE_URL}${config.ENGINE_ENDPOINT}`)
      .then((response) => response.json())
      .then((data) => setEngineTypes(data.engineTypes))
      .catch((error) => console.error("Error fetching engine types:", error));
  }, []);

  // Use useEffect to log engineImage when it updates
  useEffect(() => {
    if (!ecuStatus) {
      setSelectedEngine("");
      // setCommands([]);
      setEngineImage(null);
    }
  }, [ecuStatus, setSelectedEngine]);

  // Fetch engine details when an engine is selected
  const handleEngineSelect = (event) => {
    const engine = event.target.value;
    console.log(`${config.API_BASE_URL}/api/engines/${engine}.txt`);
    setSelectedEngine(engine);

    // Fetch the engine's commands and image from the file
    fetch(`${config.API_BASE_URL}/api/engines/${engine}.txt`)
      .then((response) => response.text())
      .then((text) => {
        const [imageUrl] = text.split("\n");
        setEngineImage(imageUrl);
        // setCommands(cmds);
      })
      .catch((error) => console.error("Error fetching engine data:", error));
  };

  return (
    <div
      style={{
        padding: "10px",
        display: "flex",
        alignItems: "center", // Vertically center content
      }}
      className={`${!ecuStatus ? "enabled" : "disabled"}`}
    >
      <div style={{ marginRight: "10px" }}>
        {" "}
        {/* Adjust spacing between image and select */}
        <h3>Select Engine</h3>
        <select onChange={handleEngineSelect} value={selectedEngine}>
          <option value="">--Select Engine--</option>
          {engineTypes.map((engine) => (
            <option key={engine} value={engine}>
              {engine}
            </option>
          ))}
        </select>
      </div>
      {engineImage && (
        <img
          src={`${config.API_BASE_URL}/engines/images/${engineImage}`}
          alt={selectedEngine}
          style={{
            width: "60px", // Set image width
            height: "auto", // Maintain aspect ratio
            border: "1px solid #ddd", // Optional border
            borderRadius: "5px", // Optional rounded corners
          }}
        />
      )}
    </div>
  );
};

export default EngineSelector;
