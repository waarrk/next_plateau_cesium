import React from "react";
import {Entity, PolylineGraphics} from "resium";
import {Cartesian3, Color, PolylineDashMaterialProperty} from "cesium";

const SatelliteOrbit = ({
  pastPositions,
  futurePositions,
}: {
  pastPositions: Cartesian3[];
  futurePositions: Cartesian3[];
}) => (
  <>
    {pastPositions.length > 0 && (
      <Entity>
        <PolylineGraphics
          positions={pastPositions}
          width={1}
          material={Color.WHITE}
        />
      </Entity>
    )}

    {futurePositions.length > 0 && (
      <Entity>
        <PolylineGraphics
          positions={futurePositions}
          width={2}
          material={
            new PolylineDashMaterialProperty({
              color: Color.WHITE.withAlpha(0.7),
              dashLength: 16.0,
            })
          }
        />
      </Entity>
    )}
  </>
);

export default SatelliteOrbit;
