import {Cartesian3} from "cesium";

export type SatelliteData = {
  latitude: number;
  longitude: number;
  height: number;
};

export type VisibilityTimes = {
  enter: Date | null;
  exit: Date | null;
};

export type OrbitPositions = {
  pastPositions: Cartesian3[];
  futurePositions: Cartesian3[];
  satellitePosition: Cartesian3 | null;
};

export type SatelliteState = {
  satelliteData: SatelliteData | undefined;
  satelliteName: string;
  visibilityTimes: VisibilityTimes;
  tleData: string[];
  tleFetchTime: Date | null;
  tleLastNumber: number;
  currentTime: Date;
  orbitPositions: OrbitPositions;
};
