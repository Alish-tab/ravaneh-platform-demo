import { TileLayer } from 'react-leaflet';

type BaseTileLayerProps = {
  url: string;
  attribution: string;
};

/**
 * Replaceable basemap tile layer.
 * Tile URL / attribution come from env — not hardcoded in business map features.
 */
export function BaseTileLayer({ url, attribution }: BaseTileLayerProps) {
  return <TileLayer url={url} attribution={attribution} />;
}
