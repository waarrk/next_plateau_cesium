import React, {useEffect, useState} from "react";
import {
  Viewer,
  Entity,
  Globe,
  Sun,
  PolylineGraphics,
  EllipseGraphics,
} from "resium";
import {
  Ion,
  Cartesian3,
  createWorldTerrainAsync,
  CesiumTerrainProvider,
  Color,
  PolylineDashMaterialProperty,
  HeightReference,
} from "cesium";
import * as satellite from "satellite.js";

const NORAD_ID = "59508";

const fetchTLE = async (noradId: string) => {
  const response = await fetch(
    `https://celestrak.com/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`
  );
  const tleData = await response.text();
  const tleLines = tleData.split("\n").filter((line) => line.trim().length > 0);

  console.log(tleLines);
  return tleLines;
};

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
  const [pastPositions, setPastPositions] = useState<Cartesian3[]>([]);
  const [futurePositions, setFuturePositions] = useState<Cartesian3[]>([]);
  const [satellitePosition, setSatellitePosition] = useState<
    Cartesian3 | undefined
  >(undefined);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [satelliteData, setSatelliteData] = useState<{
    latitude: number;
    longitude: number;
    height: number;
  } | null>(null);
  const [tleData, setTleData] = useState<string[]>([]);
  const [tleFetchTime, setTleFetchTime] = useState<Date | null>(null);
  const [tleLastNumber, setTleLastNumber] = useState<number>(0);

  useEffect(() => {
    const fetchTLEData = async () => {
      const tleLines = await fetchTLE(NORAD_ID);
      const tleLastNumber = parseInt(tleLines[2].split(" ")[10]);

      if (tleLastNumber) {
        tleLines[2] = tleLines[2].replace(/\r?\n/g, "");
      }

      setTleLastNumber(tleLastNumber);
      setTleData(tleLines);
      setTleFetchTime(new Date());
    };

    const fetchTerrainProvider = async () => {
      const terrain = await createWorldTerrainAsync();
      setTerrainProvider(terrain);
    };

    fetchTLEData();
    fetchTerrainProvider();

    const tleInterval = setInterval(fetchTLEData, 180 * 60 * 1000); // 180分ごとにTLEを更新

    return () => clearInterval(tleInterval); // コンポーネントがアンマウントされたらタイマーをクリア
  }, []);

  useEffect(() => {
    if (tleData.length === 0) return;

    const calculateOrbit = () => {
      const satrec = satellite.twoline2satrec(tleData[1], tleData[2]);
      const now = new Date();

      const newPastPositions: Cartesian3[] = [];
      const newFuturePositions: Cartesian3[] = [];
      for (let i = -90; i <= 180; i += 0.1) {
        const time = new Date(now.getTime() + i * 60000); // 時間を1分ごとに進める
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
          if (i < 0) {
            newPastPositions.push(positionCart);
          } else {
            newFuturePositions.push(positionCart);
          }
        }
      }
      return {newPastPositions, newFuturePositions};
    };

    const updateOrbit = () => {
      const {newPastPositions, newFuturePositions} = calculateOrbit();
      setPastPositions(newPastPositions);
      setFuturePositions(newFuturePositions);
      setSatellitePosition(newFuturePositions[0]);
    };

    updateOrbit();

    const interval = setInterval(() => {
      const satrec = satellite.twoline2satrec(tleData[1], tleData[2]);
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
        setSatelliteData({latitude, longitude, height});
        setCurrentTime(now);
        updateOrbit(); // 軌道の再計算を呼び出す
      }
    }, 1000); // 1秒ごとに更新

    return () => clearInterval(interval);
  }, [tleData]);

  const visibilityRadius = 2000 * 1000;

  const formatTime = (date: Date) => {
    return date.toISOString().split("T")[1].split(".")[0];
  };

  return (
    <div style={{height: "100vh", position: "relative"}}>
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
          >
            <EllipseGraphics
              semiMajorAxis={visibilityRadius}
              semiMinorAxis={visibilityRadius}
              material={Color.RED.withAlpha(0.2)}
              heightReference={HeightReference.CLAMP_TO_GROUND}
            />
          </Entity>

          <Sun show={false} />

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
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          padding: "10px",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "white",
        }}
      >
        <div>UTC: {formatTime(currentTime)} UTC</div>
        <div>
          JST:{" "}
          {formatTime(new Date(currentTime.getTime() + 9 * 60 * 60 * 1000))} JST
        </div>
        {satelliteData && (
          <>
            <div>KASHIWA</div>
            <div>NORAD ID: 59508</div>
            <div>Latitude: {satelliteData.latitude.toFixed(2)}°</div>
            <div>Longitude: {satelliteData.longitude.toFixed(2)}°</div>
            <div>Altitude: {(satelliteData.height / 1000).toFixed(2)} km</div>
          </>
        )}
        {tleFetchTime && (
          <div>
            TLE Fetch:{" "}
            {formatTime(new Date(tleFetchTime.getTime() + 9 * 60 * 60 * 1000))}{" "}
            JST
          </div>
        )}
        {tleData.length > 0 && <div>TLE:{tleLastNumber}</div>}
      </div>
    </div>
  );
};

export default Cesium;
