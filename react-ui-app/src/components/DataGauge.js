// src/CanDataGauge.js
import React from "react";
import ReactSpeedometer from "react-d3-speedometer";

const DataGauge = ({
  canData,
  maxValue,
  minValue,
  customSegmentStops,
  segmentColors,
  needleColor = "black",
  endColor = "#ccc",
  startColor = "#ccc",
  segments = 1,
  currentValueText = "",
  valueTextFontSize = "12px",
  ringWidth = 5,
  labelFontSize = "12px",
  textColor = "black",
  needleTransition = "easeElastic",
  needleTransitionDuration = 1000,
}) => {
  return (
    <ReactSpeedometer
      minValue={minValue}
      maxValue={maxValue}
      value={canData}
      ringWidth={ringWidth}
      needleColor={needleColor}
      startColor={startColor}
      endColor={endColor}
      segments={segments}
      textColor={textColor}
      customSegmentStops={customSegmentStops}
      segmentColors={segmentColors}
      currentValueText={currentValueText}
      labelFontSize={labelFontSize}
      width={300}
      height={200}
    />
  );
};

export default DataGauge;
