import React from 'react';
import { head, pluck } from 'ramda';
import {
  LayersControl as LeafletLayersControl,
  TileLayer,
  WMSTileLayer
} from 'react-leaflet';
import PropTypes from 'prop-types';

import layers from './mapLayers';

const possibleLayers = pluck('name', layers);
const localStorageBaseLayer = possibleLayers.find(
  name => name === window.localStorage.getItem('selectedBaseLayer')
);
const selectedBaseLayer = localStorageBaseLayer || head(possibleLayers);

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
        {layer.type === 'WMTS' && (
          <TileLayer
            attribution={layer.attribution}
            url={layer.url}
            maxZoom={layer.maxZoom ? layer.maxZoom : 22}
            maxNativeZoom={layer.maxNativeZoom ? layer.maxNativeZoom : 22}
          />
        )}
        {layer.type === 'WMS' && (
          <WMSTileLayer
            attribution={layer.attribution}
            layers={layer.layers}
            url={layer.url}
          />
        )}
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
