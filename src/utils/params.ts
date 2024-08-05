import {Cartesian3} from "cesium";

export const camera_ground_station_degree = {
  longitude: 140.0219295,
  latitude: 35.6887391,
  height: 100,
};

export const camera_ground_station = Cartesian3.fromDegrees(
  camera_ground_station_degree.longitude,
  camera_ground_station_degree.latitude,
  camera_ground_station_degree.height
);
