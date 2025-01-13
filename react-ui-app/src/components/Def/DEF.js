import { useContext, useEffect, useState } from "react";
import DataGauge from "../DataGauge";
import { SocketContext } from "../../conf/SocketContext";

function DEFLevel({ selectedInterface }) {
  const socket = useContext(SocketContext);
  const [defLevel, setDefLevel] = useState(null); // State to store DEF tank level

  useEffect(() => {
    //Reset Control when selectedInterface changes
    setDefLevel(0);
    // Listen for DEF tank level updates
    socket.on("def_level_update", (data) => {
      const { def_level } = data;
      //   console.log("Received DEF Level update: " + def_level + "%");
      setDefLevel(def_level); // Update the DEF level state
    });

    // Clean up event listeners on component unmount
    return () => {
      socket.off("def_level_update");
    };
  }, [selectedInterface, socket]); // Empty dependency array means this runs once when the component mounts

  return (
    <div style={{ position: "relative", textAlign: "center" }}>
      <DataGauge
        minValue={0}
        maxValue={100}
        customSegmentStops={[0, 20, 40, 60, 80, 100]}
        segmentColors={["red", "#D3D3D3", "#D3D3D3", "#D3D3D3", "#D3D3D3"]} // Set colors for each segment
        canData={defLevel}
        ringWidth={20}
        needleColor="red"
        startColor="grey"
        textColor="transparent"
        currentValueText=""
        labelFontSize="0px"
        valueTextFontSize="16px"
      />
      <div style={{ position: "absolute", top: "85%", left: "10%", transform: "translate(-50%, -50%)", fontSize: "18px" }}>E</div>
      <div style={{ position: "absolute", top: "85%", right: "10%", transform: "translate(50%, -50%)", fontSize: "18px" }}>F</div>
      <div style={{ marginTop: "-30px", fontWeight: "bold", color: "#0073e6" }}>{defLevel !== null ? `${defLevel}%` : "No Data"} DEF</div>
    </div>
  );
}

export default DEFLevel;
