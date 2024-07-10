import {CesiumTerrainProvider, createWorldTerrainAsync} from "cesium";

export const fetchTerrainProvider = async (
  setTerrainProvider: React.Dispatch<
    React.SetStateAction<CesiumTerrainProvider | undefined>
  >
) => {
  const terrain = await createWorldTerrainAsync();
  setTerrainProvider(terrain);
};
