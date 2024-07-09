import React, {useEffect, useState} from "react";
import {
  Viewer,
  Entity,
  PointGraphics,
  Globe,
  LabelGraphics,
  Sun,
  PolylineGraphics,
} from "resium";
import {
  Ion,
  Cartesian3,
  createWorldTerrainAsync,
  CesiumTerrainProvider,
  Color,
} from "cesium";
import * as satellite from "satellite.js";

const KASHIWA_TLE = [
  "1 59508U 98067WH  24190.04654210  .00198687  00000+0  12698-2 0  9991",
  "2 59508  51.6264 204.6584 0012724  30.1243 330.0485 15.75104741 13777",
];

const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_DEFAULT_ACCESS_TOKEN;
Ion.defaultAccessToken = cesiumToken || "YOUR_DEFAULT_TOKEN_HERE";

const Cesium = () => {
  const camera_position = Cartesian3.fromDegrees(
    140.0219295,
    35.6887391,
    20000000
  );
  const camera_ground_station = Cartesian3.fromDegrees(
    140.0219295,
    35.6887391,
    100
  );

  const [terrainProvider, setTerrainProvider] = useState<
    CesiumTerrainProvider | undefined
  >(undefined);
  const [positions, setPositions] = useState<Cartesian3[]>([]);
  const [satellitePosition, setSatellitePosition] = useState<
    Cartesian3 | undefined
  >(undefined);

  useEffect(() => {
    const fetchTerrainProvider = async () => {
      const terrain = await createWorldTerrainAsync();
      setTerrainProvider(terrain);
    };

    const calculateOrbit = () => {
      const satrec = satellite.twoline2satrec(KASHIWA_TLE[0], KASHIWA_TLE[1]);
      const now = new Date();

      const newPositions: Cartesian3[] = [];
      for (let i = 0; i <= 90; i += 5) {
        const time = new Date(now.getTime() + i * 60000); // 時間を5分ごとに進める
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

          const positionCart = Cartesian3.fromDegrees(
            longitude,
            latitude,
            height
          );
          newPositions.push(positionCart);
        }
      }
      setPositions(newPositions);
      setSatellitePosition(newPositions[0]); // 初期位置を設定
    };

    fetchTerrainProvider();
    calculateOrbit();

    const interval = setInterval(() => {
      const satrec = satellite.twoline2satrec(KASHIWA_TLE[0], KASHIWA_TLE[1]);
      const now = new Date();
      const positionAndVelocity = satellite.propagate(satrec, now);

      if (
        positionAndVelocity &&
        typeof positionAndVelocity.position !== "boolean"
      ) {
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const longitude = satellite.degreesLong(positionGd.longitude);
        const latitude = satellite.degreesLat(positionGd.latitude);
        const height = positionGd.height * 1000;

        const positionCart = Cartesian3.fromDegrees(
          longitude,
          latitude,
          height
        );
        setSatellitePosition(positionCart); // 衛星位置を更新
      }
    }, 1000); // 1秒ごとに更新

    return () => clearInterval(interval); // コンポーネントがアンマウントされたらタイマーをクリア
  }, []);

  return (
    <div style={{height: "100vh"}}>
      {terrainProvider ? (
        <Viewer
          full
          terrainProvider={terrainProvider}
          timeline={false}
          homeButton={false}
          geocoder={false}
          sceneModePicker={false}
          navigationHelpButton={false}
          fullscreenButton={false}
          baseLayerPicker={false}
          projectionPicker={false}
          animation={false}
        >
          <Globe enableLighting />

          <Entity
            name="Ground Station"
            position={camera_ground_station}
            point={{pixelSize: 10}}
            label={{
              text: "CIT Ground Station",
              font: "14px sans-serif",
              pixelOffset: new Cartesian3(0, 20),
            }}
          />

          <Sun show={false} />

          {positions.length > 0 && (
            <Entity>
              <PolylineGraphics
                positions={positions}
                width={1}
                material={Color.WHITE}
              />
            </Entity>
          )}

          {satellitePosition && (
            <Entity
              name="Satellite"
              position={satellitePosition}
              point={{pixelSize: 5}}
              label={{
                text: "KASHIWA",
                font: "14px sans-serif",
                pixelOffset: new Cartesian3(0, 20),
              }}
            />
          )}
        </Viewer>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
};

export default Cesium;
