import { Viewer, Entity, PointGraphics, EntityDescription } from "resium";
import { Ion, Cartesian3, createWorldTerrain } from "cesium";

Ion.defaultAccessToken = `${process.env.CESIUM_ION_DEFAULT_ACCESS_TOKEN}`

const terrainProvider = createWorldTerrain();
const position = Cartesian3.fromDegrees(-74.0707383, 40.7117244, 100);

export default function Cesium() {
  return (
    <Viewer full terrainProvider={terrainProvider}>
      <Entity position={position} name="Tokyo">
        <PointGraphics pixelSize={10} />
      </Entity>
    </Viewer>
  )
}