import React from "react";

const ToggleButton = ({ isOn, handleStartOff, setCommand }) => {
  //   const [isOn, setIsOn] = useState(false);

  //   const toggleSwitch = () => {
  //     setIsOn(!isOn);
  //   };

  function handleClickEvent() {
    // setCommand(isOn ? "50,1" : "50,0");
    handleStartOff();
  }

  return (
    <button
      onClick={handleClickEvent}
      style={{
        ...styles.button,
        backgroundColor: isOn ? "#4CAF50" : "#D9534F",
      }}
    >
      {isOn ? "On" : "Off"}
    </button>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#f0f0f0",
  },
  button: {
    padding: "15px 30px",
    fontSize: "20px",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
};

export default ToggleButton;
