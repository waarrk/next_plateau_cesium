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
import {
  calculateOrbit,
  calculateVisibilityRadius,
} from "../utils/satelliteOrbit";

// 定数を定義
const NORAD_ID = "59508";
const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_DEFAULT_ACCESS_TOKEN;
Ion.defaultAccessToken = cesiumToken || "YOUR_DEFAULT_TOKEN_HERE";

// 型定義
type SatelliteData = {
  latitude: number;
  longitude: number;
  height: number;
};

type VisibilityTimes = {
  enter: Date | null;
  exit: Date | null;
};

const Cesium = () => {
  // 状態管理
  const [terrainProvider, setTerrainProvider] = useState<
    CesiumTerrainProvider | undefined
  >(undefined);
  const [pastPositions, setPastPositions] = useState<Cartesian3[]>([]);
  const [futurePositions, setFuturePositions] = useState<Cartesian3[]>([]);
  const [satellitePosition, setSatellitePosition] = useState<Cartesian3 | null>(
    null
  );
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [satelliteData, setSatelliteData] = useState<SatelliteData | undefined>(
    undefined
  );
  const [satelliteName, setSatelliteName] = useState<string>("");
  const [tleData, setTleData] = useState<string[]>([]);
  const [tleFetchTime, setTleFetchTime] = useState<Date | null>(null);
  const [tleLastNumber, setTleLastNumber] = useState<number>(0);
  const [visibilityTimes, setVisibilityTimes] = useState<VisibilityTimes>({
    enter: null,
    exit: null,
  });

  // 地形データとTLEデータの取得
  useEffect(() => {
    fetchTLEData(
      NORAD_ID,
      setTleLastNumber,
      setTleData,
      setTleFetchTime,
      setSatelliteName
    );
    fetchTerrainProvider(setTerrainProvider);

    const tleInterval = setInterval(() => {
      fetchTLEData(
        NORAD_ID,
        setTleLastNumber,
        setTleData,
        setTleFetchTime,
        setSatelliteName
      );
    }, 180 * 60 * 1000);

    return () => clearInterval(tleInterval);
  }, []);

  // 衛星軌道の計算と状態更新
  useEffect(() => {
    if (tleData.length === 0) return;

    const updateOrbit = () => {
      const {newPastPositions, newFuturePositions, visibilityTimes} =
        calculateOrbit(tleData, setSatelliteData, setCurrentTime);
      setPastPositions(newPastPositions);
      setFuturePositions(newFuturePositions);
      setSatellitePosition(newFuturePositions[0]);
      setVisibilityTimes(visibilityTimes);
    };

    updateOrbit();

    const interval = setInterval(() => {
      updateOrbit();
    }, 1000);

    return () => clearInterval(interval);
  }, [tleData]);

  // 可視性の計算
  const visibilityRadius = satelliteData
    ? calculateVisibilityRadius(satelliteData.height)
    : 2000 * 1000;

  const isSatelliteInRange = (): boolean => {
    if (!satellitePosition) return false;
    const distance = Cartesian3.distance(
      camera_ground_station,
      satellitePosition
    );
    return distance <= visibilityRadius;
  };

  // UIコンポーネント
  return (
    <div className="h-screen relative">
      {terrainProvider ? (
        <Viewer
          full
          terrainProvider={terrainProvider}
          timeline={false}
          homeButton={false}
          geocoder={false}
          navigationHelpButton={false}
          fullscreenButton={false}
          baseLayerPicker={false}
          projectionPicker={false}
          animation={false}
        >
          <Globe enableLighting />

          <GroundStation visibilityRadius={visibilityRadius} />

          <Sun show={false} />

          <SatelliteOrbit
            pastPositions={pastPositions}
            futurePositions={futurePositions}
          />

          <SatelliteEntity
            satelliteName={satelliteName}
            satellitePosition={satellitePosition}
            isSatelliteInRange={isSatelliteInRange}
          />
        </Viewer>
      ) : (
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      )}
      <InfoBox
        currentTime={currentTime}
        satelliteData={satelliteData}
        satelliteName={satelliteName}
        tleFetchTime={tleFetchTime}
        tleLastNumber={tleLastNumber}
        tleData={tleData}
        visibilityTimes={visibilityTimes}
      />
    </div>
  );
};

export default Cesium;

// GroundStationコンポーネント
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

// SatelliteOrbitコンポーネント
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

// SatelliteEntityコンポーネント
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

// InfoBoxコンポーネント
const InfoBox = ({
  currentTime,
  satelliteData,
  satelliteName,
  tleFetchTime,
  tleLastNumber,
  tleData,
  visibilityTimes,
}: {
  currentTime: Date;
  satelliteData: SatelliteData | undefined;
  satelliteName: string;
  tleFetchTime: Date | null;
  tleLastNumber: number;
  tleData: string[]; // <== Define the type for tleData
  visibilityTimes: VisibilityTimes;
}) => {
  return (
    <div className="absolute top-0 left-0 p-3 bg-black bg-opacity-50 text-white">
      <div>UTC: {formatTime(currentTime)} UTC</div>
      <div>
        JST: {formatTime(new Date(currentTime.getTime() + 9 * 60 * 60 * 1000))}{" "}
        JST
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
      {tleData.length > 0 && <div>TLE: {tleLastNumber}</div>}{" "}
      {/* <== tleData is now accessible */}
      {visibilityTimes.enter && visibilityTimes.exit && (
        <>
          <div>
            Enter Visibility:{" "}
            {formatTime(
              new Date(visibilityTimes.enter.getTime() + 9 * 60 * 60 * 1000)
            )}{" "}
            JST
          </div>
          <div>
            Remaining Time:
            {formatTime(
              new Date(visibilityTimes.enter.getTime() - currentTime.getTime())
            )}
          </div>
          <div>
            Exit Visibility:{" "}
            {formatTime(
              new Date(visibilityTimes.exit.getTime() + 9 * 60 * 60 * 1000)
            )}{" "}
            JST
          </div>
        </>
      )}
    </div>
  );
};
