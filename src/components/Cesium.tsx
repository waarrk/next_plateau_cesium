import React, {useEffect, useState} from "react";
import {Viewer, Globe, Sun} from "resium";
import {Ion, Cartesian3, CesiumTerrainProvider} from "cesium";

import {camera_ground_station} from "../utils/params";
import {fetchTerrainProvider} from "../utils/cesiumUtil";
import InfoBox from "../components/Infobox";
import {
  calculateOrbit,
  calculateVisibilityRadius,
} from "../utils/satelliteOrbit";
import GroundStation from "../components/GroundStation";
import SatelliteEntity from "../components/SatelliteEntity";
import SatelliteOrbit from "../components/SatelliteOrbit";

import {fetchTLEData} from "../utils/norad";

// types
import {SatelliteData, SatelliteState} from "../utils/satelliteType";

// 定数を定義
const NORAD_ID = "59508";
const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_DEFAULT_ACCESS_TOKEN;
Ion.defaultAccessToken = cesiumToken || "YOUR_DEFAULT_TOKEN_HERE";

const Cesium = () => {
  const [terrainProvider, setTerrainProvider] = useState<
    CesiumTerrainProvider | undefined
  >(undefined);
  const [satelliteState, setSatelliteState] = useState<SatelliteState>({
    satelliteData: undefined,
    satelliteName: "",
    visibilityTimes: {enter: null, exit: null},
    tleData: [],
    tleFetchTime: null,
    tleLastNumber: 0,
    currentTime: new Date(),
    orbitPositions: {
      pastPositions: [],
      futurePositions: [],
      satellitePosition: null,
    },
  });

  // 地形データとTLEデータの取得
  useEffect(() => {
    const fetchData = async () => {
      await fetchTerrainProvider(setTerrainProvider);

      fetchTLEData(
        NORAD_ID,
        (tleLastNumber: number) => {
          setSatelliteState((prev) => ({
            ...prev,
            tleLastNumber,
          }));
        },
        (tleData: string[]) => {
          setSatelliteState((prev) => ({
            ...prev,
            tleData,
          }));
        },
        (tleFetchTime: Date | null) => {
          setSatelliteState((prev) => ({
            ...prev,
            tleFetchTime,
          }));
        },
        (satelliteName: string) => {
          setSatelliteState((prev) => ({
            ...prev,
            satelliteName,
          }));
        }
      );
    };

    fetchData();

    const tleInterval = setInterval(() => {
      fetchTLEData(
        NORAD_ID,
        (tleLastNumber: number) => {
          setSatelliteState((prev) => ({
            ...prev,
            tleLastNumber,
          }));
        },
        (tleData: string[]) => {
          setSatelliteState((prev) => ({
            ...prev,
            tleData,
          }));
        },
        (tleFetchTime: Date | null) => {
          setSatelliteState((prev) => ({
            ...prev,
            tleFetchTime,
          }));
        },
        (satelliteName: string) => {
          setSatelliteState((prev) => ({
            ...prev,
            satelliteName,
          }));
        }
      );
    }, 180 * 60 * 1000);

    return () => clearInterval(tleInterval);
  }, []);

  // 衛星軌道の計算と状態更新
  useEffect(() => {
    if (satelliteState.tleData.length === 0) return;

    const updateOrbit = () => {
      const {newPastPositions, newFuturePositions, visibilityTimes} =
        calculateOrbit(
          satelliteState.tleData,
          (satelliteData: SatelliteData | undefined) =>
            setSatelliteState((prev) => ({...prev, satelliteData})),
          (currentTime: Date) =>
            setSatelliteState((prev) => ({...prev, currentTime}))
        );

      setSatelliteState((prev) => ({
        ...prev,
        orbitPositions: {
          pastPositions: newPastPositions,
          futurePositions: newFuturePositions,
          satellitePosition: newFuturePositions[0] || null,
        },
        visibilityTimes,
      }));
    };

    updateOrbit();

    const interval = setInterval(() => {
      updateOrbit();
    }, 1000);

    return () => clearInterval(interval);
  }, [satelliteState.tleData]);

  // 可視性の計算
  const visibilityRadius = satelliteState.satelliteData
    ? calculateVisibilityRadius(satelliteState.satelliteData.height)
    : 2000 * 1000;

  const isSatelliteInRange = (): boolean => {
    const {satellitePosition} = satelliteState.orbitPositions;
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
            pastPositions={satelliteState.orbitPositions.pastPositions}
            futurePositions={satelliteState.orbitPositions.futurePositions}
          />

          <SatelliteEntity
            satelliteName={satelliteState.satelliteName}
            satellitePosition={satelliteState.orbitPositions.satellitePosition}
            isSatelliteInRange={isSatelliteInRange}
          />
        </Viewer>
      ) : (
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      )}
      <InfoBox
        NORAD_ID={Number(NORAD_ID)}
        currentTime={satelliteState.currentTime}
        satelliteData={satelliteState.satelliteData}
        satelliteName={satelliteState.satelliteName}
        tleFetchTime={satelliteState.tleFetchTime}
        tleLastNumber={satelliteState.tleLastNumber}
        tleData={satelliteState.tleData}
        visibilityTimes={satelliteState.visibilityTimes}
      />
    </div>
  );
};

export default Cesium;
