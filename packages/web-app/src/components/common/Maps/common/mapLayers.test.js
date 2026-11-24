import layers from './mapLayers';
import { LAYER_ROLE, LAYER_TYPE, PANES } from './layerEnums';

describe('mapLayers', () => {
  it('uses the canonical OpenStreetMap tile endpoint', () => {
    const osmLayer = layers.find(layer => layer.id === 'osm');

    expect(osmLayer.url).toBe('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(osmLayer.referrerPolicy).toBe('strict-origin-when-cross-origin');
  });

  it('uses the LiDAR WMTS pyramid while preserving its overlay settings', () => {
    const lidarLayer = layers.find(layer => layer.id === 'fr_lidar_hillshade');
    const url = new URL(lidarLayer.url);

    expect(url.origin + url.pathname).toBe('https://data.geopf.fr/wmts');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      SERVICE: 'WMTS',
      VERSION: '1.0.0',
      REQUEST: 'GetTile',
      STYLE: 'normal',
      TILEMATRIXSET: 'PM_0_18',
      FORMAT: 'image/png',
      LAYER: 'IGNF_LIDAR-HD_MNT_ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW',
      TILEMATRIX: '{z}',
      TILEROW: '{y}',
      TILECOL: '{x}'
    });
    expect(lidarLayer).toMatchObject({
      name: 'France - MNT LiDAR HD',
      role: LAYER_ROLE.OVERLAY,
      type: LAYER_TYPE.WMTS,
      pane: PANES.HILLSHADE,
      defaultOn: false,
      maxNativeZoom: 18,
      maxZoom: 22
    });
  });
});
