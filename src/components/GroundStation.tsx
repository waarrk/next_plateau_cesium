import React from "react";
import {Entity, EllipseGraphics} from "resium";
import {Cartesian3, Color, HeightReference} from "cesium";

import {camera_ground_station} from "../utils/params";

const GroundStation = ({visibilityRadius}: {visibilityRadius: number}) => (
  <Entity
    name="Ground Station"
    position={camera_ground_station}
    point={{pixelSize: 10}}
    label={{
      text: "CIT Ground Station",
      font: "14px sans-serif",
      pixelOffset: new Cartesian3(0, 20),
    }}
  >
    <EllipseGraphics
      semiMajorAxis={visibilityRadius}
      semiMinorAxis={visibilityRadius}
      material={Color.RED.withAlpha(0.2)}
      heightReference={HeightReference.CLAMP_TO_GROUND}
    />
  </Entity>
);

export default GroundStation;
