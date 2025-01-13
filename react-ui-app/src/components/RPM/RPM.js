import { useContext, useEffect, useState } from "react";
import DataGauge from "../DataGauge";
import { SocketContext } from "../../conf/SocketContext";

function RMP({ selectedInterface }) {
  const socket = useContext(SocketContext);
  const [rpm, setRpm] = useState(0); // State for RPM

  useEffect(() => {
    //Reset Control when selectedInterface changes
    setRpm(0);
    // Connect to the server and listen for RPM updates
    socket.on("rpm_update", (data) => {
      const { rpm } = data;
      // console.log("Received RPM update: " + rpm + " RPM");
      setRpm(rpm); // Update the RPM state
    });

    // Clean up the event listener on component unmount
    return () => {
      socket.off("rpm_update");
    };
  }, [selectedInterface, socket]); // Empty dependency array means this runs once when the component mounts

  const formattedRPM = String(Math.round(rpm / 100)).padStart(5, "0");

  return (
    <DataGauge
      maxValue={30}
      customSegmentStops={[0, 5, 10, 15, 20, 25, 30]}
      canData={Math.round(rpm / 100)}
      ringWidth={20}
      needleColor="red"
      startColor="grey"
      textColor="black"
      ß
      currentValueText={`${formattedRPM * 100} RPM`}
      labelFontSize="14px"
      valueTextFontSize="16px"
    />
  );
}

export default RMP;
