import React from 'react';
import { head, pluck } from 'ramda';
import {
  LayerGroup,
  LayersControl as LeafletLayersControl,
  TileLayer,
  WMSTileLayer
} from 'react-leaflet';
import PropTypes from 'prop-types';

import layers from './mapLayers';
import * as L from 'leaflet';

const possibleLayers = pluck('name', layers);
const localStorageBaseLayer = possibleLayers.find(
  name => name === window.localStorage.getItem('selectedBaseLayer')
);
const selectedBaseLayer = localStorageBaseLayer || head(possibleLayers);

const createWMTSTileLayer = layer => (
  <TileLayer
    attribution={layer.attribution}
    url={layer.url}
    minZoom={layer.minZoom}
    maxZoom={layer.maxZoom ?? 22}
    maxNativeZoom={layer.maxNativeZoom ?? 22}
    bounds={layer.bounds ?? new L.LatLngBounds(new L.LatLng(-90, -180), new L.LatLng(90, 180))}
  />
);

const createWMSTileLayer = layer => (
  <WMSTileLayer
    attribution={layer.attribution}
    layers={layer.layers}
    url={layer.url}
  />
);

const OSM_LAYER = layers[0];
const OSM_TILE_LAYER = createWMTSTileLayer(OSM_LAYER);

const BaseMapLayer = ({ layer }) => (
  <LayerGroup>
    {OSM_TILE_LAYER}
    {layer !== OSM_LAYER && (
      <>
        {layer.type === 'WMTS' && createWMTSTileLayer(layer)}
        {layer.type === 'WMS' && createWMSTileLayer(layer)}
      </>
    )}
  </LayerGroup>
);

BaseMapLayer.propTypes = {
  layer: PropTypes.shape({
    type: PropTypes.string.isRequired,
    attribution: PropTypes.string,
    url: PropTypes.string,
    minZoom: PropTypes.number,
    maxZoom: PropTypes.number,
    maxNativeZoom: PropTypes.number,
    bounds: PropTypes.object,
    layers: PropTypes.string
  }).isRequired
};

const LayersControl = ({
  position = 'topleft',
  initialLayerChecked = selectedBaseLayer
}) => (
  <LeafletLayersControl position={position}>
    {layers.map(layer => (
      <LeafletLayersControl.BaseLayer
        key={layer.name}
        checked={layer.name === initialLayerChecked}
        name={layer.name}>
        <BaseMapLayer layer={layer} />
      </LeafletLayersControl.BaseLayer>
    ))}
  </LeafletLayersControl>
);

LayersControl.propTypes = {
  position: PropTypes.oneOf([
    'topright',
    'topleft',
    'bottomright',
    'bottomleft'
  ]),
  initialLayerChecked: PropTypes.oneOf(possibleLayers)
};

export default LayersControl;
