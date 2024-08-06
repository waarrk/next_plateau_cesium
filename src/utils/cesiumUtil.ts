import {CesiumTerrainProvider, createWorldTerrainAsync} from "cesium";

export const fetchTerrainProvider = async (
  setTerrainProvider: React.Dispatch<
    React.SetStateAction<CesiumTerrainProvider | undefined>
  >
) => {
  try {
    const provider = await createWorldTerrainAsync();
    setTerrainProvider(provider);
  } catch (error) {
    console.error("Failed to fetch terrain provider", error);
    setTerrainProvider(undefined);
  }
};
