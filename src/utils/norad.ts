const fetchTLE = async (noradId: string) => {
  const response = await fetch(
    `https://celestrak.com/NORAD/elements/gp.php?CATNR=${noradId}&FORMAT=TLE`
  );
  const tleData = await response.text();
  const tleLines = tleData.split("\n").filter((line) => line.trim().length > 0);

  console.log(tleLines);
  return tleLines;
};

export const fetchTLEData = async (
  norad_id: string,
  setTleLastNumber: React.Dispatch<React.SetStateAction<number>>,
  setTleData: React.Dispatch<React.SetStateAction<string[]>>,
  setTleFetchTime: React.Dispatch<React.SetStateAction<Date | null>>,
  setSatelliteName: React.Dispatch<React.SetStateAction<string>>
) => {
  const tleLines = await fetchTLE(norad_id);
  const tleLastNumber = parseInt(tleLines[2].split(" ")[10]);

  if (tleLastNumber) {
    tleLines[2] = tleLines[2].replace(/\r?\n/g, "");
  }

  setSatelliteName(tleLines[0]);
  setTleLastNumber(tleLastNumber);
  setTleData(tleLines);
  setTleFetchTime(new Date());
};
