import React, { useState, useEffect } from "react";
import config from "../../conf/constants";

const IFSelector = ({ setSelectedInterface, selectedInterface }) => {
  const [interfaces, setInterfaces] = useState([]); // Store interfaces from the API

  // Load saved interface from local storage on mount
  useEffect(() => {
    const savedInterface = localStorage.getItem("selectedInterface");
    if (savedInterface) {
      setSelectedInterface(savedInterface);
    }

    // Fetch the list of interfaces from the API
    //`${config.API_BASE_URL}`
    fetch(`${config.API_BASE_URL}/interfaces`)
      .then((response) => response.json())
      .then((data) => {
        setInterfaces(data.interfaces); // Set the interfaces in the state
      })
      .catch((error) => console.error("Error fetching interfaces:", error));
  }, [setSelectedInterface]);

  // useEffect to handle side effects when selectedInterface changes
  useEffect(() => {
    if (selectedInterface) {
      // Save the selected interface to local storage
      localStorage.setItem("selectedInterface", selectedInterface);

      // Send the selected interface to the Flask backend
      fetch(`${config.API_BASE_URL}/interface/set`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interface: selectedInterface }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Interface set to:", data.interface);
        })
        .catch((error) => console.error("Error setting interface:", error));
    }
  }, [selectedInterface]); // Dependency array ensures this runs when selectedInterface changes

  const handleSelectionChange = (event) => {
    const selected = event.target.value;
    console.log("Set interface in handleSelectionChange", selected);
    setSelectedInterface(selected); // Update the state
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", flexDirection: "row", gap: "20px" }}>
        {/* List each interface as a radio button */}
        {interfaces.map((interfaceName, index) => (
          <label key={index} style={{ fontSize: "26px", fontWeight: "bold", textTransform: "uppercase" }}>
            <input
              type="radio"
              name="interface"
              value={interfaceName}
              checked={selectedInterface === interfaceName}
              onChange={handleSelectionChange}
              style={{ width: "20px", height: "20px", marginRight: "10px" }}
            />
            {interfaceName}
          </label>
        ))}
      </div>
    </div>
  );
};

export default IFSelector;
