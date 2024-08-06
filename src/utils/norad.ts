const fetchTLE = async (noradId: string) => {
  const response = await fetch(
    `https://celestrak.com/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`
  );
  const tleData = await response.text();
  const tleLines = tleData.split("\n").filter((line) => line.trim().length > 0);

  console.log(tleLines);
  return tleLines;
};

// Fetch TLE Data function
export const fetchTLEData = async (
  norad_id: string,
  setTleLastNumber: any,
  setTleData: any,
  setTleFetchTime: any,
  setSatelliteName: any
) => {
  const tleLines = await fetchTLE(norad_id);

  if (tleLines.length < 3) {
    console.error("Invalid TLE data");
    return;
  }

  try {
    const tleLastNumberStr = tleLines[1].substring(64, 68).trim();
    const tleLastNumber = parseInt(tleLastNumberStr, 10);

    if (isNaN(tleLastNumber)) {
      throw new Error("TLE last number is NaN");
    }

    setSatelliteName(tleLines[0].trim());
    setTleLastNumber(tleLastNumber);
    setTleData(tleLines.filter((line) => line.trim().length > 0));
    setTleFetchTime(new Date());
  } catch (error) {
    console.error("Error parsing TLE data:", error);
  }
};
