import {Ellipsoid, Cartesian3} from "cesium";
import * as satellite from "satellite.js";
import {camera_ground_station} from "./params";

export const calculateVisibilityRadius = (satelliteHeight: number): number => {
  const earthRadius = Ellipsoid.WGS84.maximumRadius;
  return Math.sqrt(
    Math.pow(earthRadius + satelliteHeight, 2) - Math.pow(earthRadius, 2)
  );
};

export const calculateOrbit = (
  tleData: string[],
  setSatelliteData: any,
  setCurrentTime: any
): {
  newPastPositions: Cartesian3[];
  newFuturePositions: Cartesian3[];
  visibilityTimes: {enter: Date | null; exit: Date | null};
} => {
  const satrec = satellite.twoline2satrec(tleData[1], tleData[2]);
  const now = new Date();

  const newPastPositions: Cartesian3[] = [];
  const newFuturePositions: Cartesian3[] = [];
  let enterVisibility: Date | null = null;
  let exitVisibility: Date | null = null;
  const visibilityRadius = calculateVisibilityRadius(400000);

  for (let i = -90; i <= 180; i += 0.1) {
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
      if (i < 0) {
        newPastPositions.push(positionCart);
      } else {
        newFuturePositions.push(positionCart);
      }

      const distance = Cartesian3.distance(camera_ground_station, positionCart);
      if (distance <= visibilityRadius) {
        // 現在より未来の範囲なら
        if (i > 0) {
          if (!enterVisibility) {
            enterVisibility = time;
          }
          // もし前回のexitVisibilityから10分以上経っていたら
          if (
            exitVisibility &&
            time.getTime() - exitVisibility.getTime() > 10 * 60 * 1000
          ) {
            break;
          }
          exitVisibility = time;
        }
      }
    }
  }

  const currentPosAndVel = satellite.propagate(satrec, now);
  if (currentPosAndVel && typeof currentPosAndVel.position !== "boolean") {
    const currentPosEci = currentPosAndVel.position;
    const currentGmst = satellite.gstime(now);
    const currentPosGd = satellite.eciToGeodetic(currentPosEci, currentGmst);

    const currentLongitude = satellite.degreesLong(currentPosGd.longitude);
    const currentLatitude = satellite.degreesLat(currentPosGd.latitude);
    const currentHeight = currentPosGd.height * 1000;

    setSatelliteData({
      latitude: currentLatitude,
      longitude: currentLongitude,
      height: currentHeight,
    });
    setCurrentTime(now);
  }

  return {
    newPastPositions,
    newFuturePositions,
    visibilityTimes: {
      enter: enterVisibility,
      exit: exitVisibility,
    },
  };
};
