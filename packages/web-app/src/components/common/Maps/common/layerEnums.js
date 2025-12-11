export const LAYER_ROLE = Object.freeze({
  BASE: 'base',
  OVERLAY: 'overlay'
});

export const LAYER_TYPE = Object.freeze({
  WMTS: 'WMTS',
  WMS: 'WMS',
  VECTOR: 'VECTOR' // future-proof (VectorTileLayer)
});

export const PANES = Object.freeze({
  BASEMAP: 'basemap',
  BASEMAP_RASTER: 'basemap-raster',
  HILLSHADE: 'hillshade',
  GEOLOGY: 'geology',
  VECTOR: 'vector',
  LABELS: 'labels'
});