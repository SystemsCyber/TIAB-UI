import React, { useState, useEffect } from "react"; // Import the CSS file for styling

const CommandPrompt = ({ setCommand, response }) => {
  const [output, setOutput] = useState([]);
  const [currentCommand, setCurrentCommand] = useState("");

  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (currentCommand.trim()) {
      if (currentCommand.trim().toLowerCase() === "clear") {
        // Clear the output if the command is 'clear'
        setOutput([]);
      } else {
        // Add the entered command and an example output to the output log
        setOutput((prevOutput) => [...prevOutput, `$ ${currentCommand}`]);
        setCommand(currentCommand);
      }
      setCurrentCommand(""); // Clear the input field
    }
  };

  useEffect(() => {
    if (response) {
      // Update the output when a new response is received
      setOutput((prevOutput) => [...prevOutput, response]);
    }
  }, [response]);

  return (
    <div className="command-prompt">
      <div className="output-area">
        <div className="command-output">
          {output.map((line, index) => (
            <div key={index}>{line}</div>
          ))}
        </div>
      </div>
      <div className="input-area">
        <span className="prompt">$ </span>
        <form onSubmit={handleCommandSubmit} style={{ flex: 1 }}>
          <input type="text" className="command-input" placeholder="Enter command" value={currentCommand} onChange={(e) => setCurrentCommand(e.target.value)} />
        </form>
      </div>
    </div>
  );
};

export default CommandPrompt;
