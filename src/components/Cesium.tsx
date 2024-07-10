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
  CesiumTerrainProvider,
  Color,
  PolylineDashMaterialProperty,
  HeightReference,
} from "cesium";

import {fetchTLEData} from "../utils/norad";
import {camera_ground_station} from "../utils/params";
import {fetchTerrainProvider} from "../utils/cesiumUtil";
import {formatTime} from "../utils/time";
import {calculateOrbit} from "../utils/satelliteOrbit";

const NORAD_ID = "59508";

const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_DEFAULT_ACCESS_TOKEN;
Ion.defaultAccessToken = cesiumToken || "YOUR_DEFAULT_TOKEN_HERE";

const Cesium = () => {
  const [terrainProvider, setTerrainProvider] =
    useState<CesiumTerrainProvider>();
  const [pastPositions, setPastPositions] = useState<Cartesian3[]>([]);
  const [futurePositions, setFuturePositions] = useState<Cartesian3[]>([]);
  const [satellitePosition, setSatellitePosition] = useState<Cartesian3>();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [satelliteData, setSatelliteData] = useState<{
    latitude: number;
    longitude: number;
    height: number;
  }>();

  // TLEデータ
  const [satelliteName, setSatelliteName] = useState<string>("");
  const [tleData, setTleData] = useState<string[]>([]);
  const [tleFetchTime, setTleFetchTime] = useState<Date | null>(null);
  const [tleLastNumber, setTleLastNumber] = useState<number>(0);

  // 初回実行
  useEffect(() => {
    fetchTLEData(
      NORAD_ID,
      setTleLastNumber,
      setTleData,
      setTleFetchTime,
      setSatelliteName
    );
    fetchTerrainProvider(setTerrainProvider);

    // TLEデータを取得するインターバル
    const tleInterval = setInterval(fetchTLEData, 180 * 60 * 1000);

    return () => clearInterval(tleInterval);
  }, []);

  useEffect(() => {
    if (tleData.length === 0) return;

    const updateOrbit = () => {
      const {newPastPositions, newFuturePositions} = calculateOrbit(
        tleData,
        setSatelliteData,
        setCurrentTime
      );
      setPastPositions(newPastPositions);
      setFuturePositions(newFuturePositions);
      setSatellitePosition(newFuturePositions[0]);
    };

    // 初回実行
    updateOrbit();

    // 衛星の位置を更新するインターバル
    const interval = setInterval(() => {
      updateOrbit();
    }, 1000);

    return () => clearInterval(interval);
  }, [tleData]);

  const visibilityRadius = 2000 * 1000;

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
              name={satelliteName}
              position={satellitePosition}
              point={{pixelSize: 5}}
              label={{
                text: satelliteName,
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
            <div>Satellite: {satelliteName}</div>
            <div>NORAD ID: {NORAD_ID}</div>
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
