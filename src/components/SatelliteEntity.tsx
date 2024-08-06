import React from "react";
import {Entity, PolylineGraphics} from "resium";
import {Cartesian3, Color} from "cesium";

import {camera_ground_station} from "../utils/params";

const SatelliteEntity = ({
  satelliteName,
  satellitePosition,
  isSatelliteInRange,
}: {
  satelliteName: string;
  satellitePosition: Cartesian3 | null;
  isSatelliteInRange: () => boolean;
}) => (
  <>
    {satellitePosition && (
      <>
        <Entity
          name={satelliteName}
          position={satellitePosition}
          point={{pixelSize: 5}}
          label={{
            text: satelliteName,
            font: "14px sans-serif",
            pixelOffset: new Cartesian3(0, 20),
          }}
        />
        {isSatelliteInRange() && (
          <Entity>
            <PolylineGraphics
              positions={[camera_ground_station, satellitePosition]}
              width={1}
              material={Color.YELLOW}
            />
          </Entity>
        )}
      </>
    )}
  </>
);

export default SatelliteEntity;
