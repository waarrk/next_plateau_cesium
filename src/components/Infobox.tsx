import {formatTime} from "../utils/time";

// types
import {SatelliteData, VisibilityTimes} from "../utils/satelliteType";

const InfoBox = ({
  NORAD_ID,
  currentTime,
  satelliteData,
  satelliteName,
  tleFetchTime,
  tleLastNumber,
  tleData,
  visibilityTimes,
}: {
  NORAD_ID: number;
  currentTime: Date;
  satelliteData: SatelliteData | undefined;
  satelliteName: string;
  tleFetchTime: Date | null;
  tleLastNumber: number;
  tleData: string[];
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
      {tleData.length > 0 && <div>TLE: {tleLastNumber}</div>}
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

export default InfoBox;
