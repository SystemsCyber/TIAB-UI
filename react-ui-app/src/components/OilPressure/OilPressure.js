import { useContext, useEffect, useState } from "react";
import DataGauge from "../DataGauge";
import { SocketContext } from "../../conf/SocketContext";

function OilPressure({ selectedInterface }) {
  const socket = useContext(SocketContext);
  const [oilPressure, setOilPressure] = useState(null); // State to store oil pressure
  // Function to convert kPa to PSI
  const convertKpaToPsi = (kPa) => (kPa * 0.1450377).toFixed(2);

  useEffect(() => {
    //Reset Control when selectedInterface changes
    setOilPressure(0);
    // Listen for oil pressure updates from the server
    socket.on("oil_pressure_update", (data) => {
      const { oil_pressure } = data;
      //console.log("Received Oil Pressure update: " + oil_pressure + " kPa");
      setOilPressure(oil_pressure); // Update the oil pressure state
    });

    // Clean up event listeners on component unmount
    return () => {
      socket.off("oil_pressure_update");
    };
  }, [selectedInterface, socket]); // Empty dependency array means this runs once when the component mounts

  return (
    <DataGauge
      minValue={0}
      maxValue={100}
      customSegmentStops={[0, 20, 40, 60, 80, 100]}
      segmentColors={["blue", "green", "yellow", "orange", "red"]}
      canData={convertKpaToPsi(oilPressure)}
      ringWidth={20}
      needleColor="black"
      startColor="grey"
      textColor="black"
      currentValueText={`Oil Pressure: ${convertKpaToPsi(oilPressure)} PSI`}
      labelFontSize="14px"
      valueTextFontSize="16px"
    />
  );
}

export default OilPressure;
