import { useContext, useEffect, useState } from "react";
import DataGauge from "../DataGauge";
import { SocketContext } from "../../conf/SocketContext";

function convertCelsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

function WaterTemp({ selectedInterface }) {
  const socket = useContext(SocketContext);
  // const [canData, setCanData] = useState(100);
  const [temperature, setTemperature] = useState(0);

  useEffect(() => {
    // Reset the temperature whenever `selectedInterface` changes
    setTemperature(0);
    // Connect to the server and listen for temperature updates
    socket.on("temperature_update", (data) => {
      const { temperature } = data;
      // console.log("Received temperature update: " + temperature + "°C");
      setTemperature(convertCelsiusToFahrenheit(temperature)); // Update the temperature state
    });

    // Clean up the event listener on component unmount
    return () => {
      socket.off("temperature_update");
    };
  }, [selectedInterface, socket]); // Empty dependency array means this runs once when the component mounts

  return (
    <DataGauge
      minValue={100}
      maxValue={250}
      customSegmentStops={[100, 150, 200, 250]}
      segmentColors={["blue", "yellow", "red", "cyan"]}
      canData={temperature}
      ringWidth={20}
      needleColor="black"
      startColor="grey"
      textColor="black"
      currentValueText={`Water Temp ${temperature} °F`}
      labelFontSize="14px"
      valueTextFontSize="16px"
    />
  );
}

export default WaterTemp;
