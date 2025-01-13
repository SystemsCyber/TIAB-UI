import React, { useState } from "react";

const Tooltip = ({ content, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleMouseOver = () => {
    setShowTooltip(true);
  };

  const handleMouseOut = () => {
    setShowTooltip(false);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} onMouseOver={handleMouseOver} onMouseOut={handleMouseOut}>
      {children}
      {showTooltip && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: "5px",
            padding: "5px 10px",
            backgroundColor: "black",
            color: "white",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
