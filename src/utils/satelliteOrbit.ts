import {Cartesian3} from "cesium";
import * as satellite from "satellite.js";

export const calculateOrbit = (
  tleData: string[],
  setSatelliteData: React.Dispatch<
    React.SetStateAction<
      | {
          latitude: number;
          longitude: number;
          height: number;
        }
      | undefined
    >
  >,
  setCurrentTime: React.Dispatch<React.SetStateAction<Date>>
) => {
  const satrec = satellite.twoline2satrec(tleData[1], tleData[2]);
  const now = new Date();

  const newPastPositions: Cartesian3[] = [];
  const newFuturePositions: Cartesian3[] = [];
  for (let i = -90; i <= 180; i += 0.1) {
    const now = new Date();
    const time = new Date(now.getTime() + i * 60000);
    const positionAndVelocity = satellite.propagate(satrec, time);

    if (
      positionAndVelocity &&
      typeof positionAndVelocity.position !== "boolean"
    ) {
      const positionEci = positionAndVelocity.position;
      const gmst = satellite.gstime(time);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      const longitude = satellite.degreesLong(positionGd.longitude);
      const latitude = satellite.degreesLat(positionGd.latitude);
      const height = positionGd.height * 1000;

      const positionCart = Cartesian3.fromDegrees(longitude, latitude, height);
      setSatelliteData({latitude, longitude, height});
      setCurrentTime(now);

      if (i < 0) {
        newPastPositions.push(positionCart);
      } else {
        newFuturePositions.push(positionCart);
      }
    }
  }
  return {newPastPositions, newFuturePositions};
};
