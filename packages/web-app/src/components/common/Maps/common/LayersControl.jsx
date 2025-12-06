import React from 'react';
import { head, pluck } from 'ramda';
import {
  LayersControl as LeafletLayersControl,
  TileLayer,
  WMSTileLayer,
  LayerGroup
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
          layer.minZoom ? (
            <LayerGroup>
              <TileLayer
                attribution='© OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                maxZoom={22}
                maxNativeZoom={18}
              />
              <TileLayer
                attribution={layer.attribution}
                url={layer.url}
                minZoom={layer.minZoom}
                maxZoom={layer.maxZoom ? layer.maxZoom : 22}
                maxNativeZoom={layer.maxNativeZoom ? layer.maxNativeZoom : 22}
              />
            </LayerGroup>
          ) : (
            <TileLayer
              attribution={layer.attribution}
              url={layer.url}
              minZoom={layer.minZoom}
              maxZoom={layer.maxZoom ? layer.maxZoom : 22}
              maxNativeZoom={layer.maxNativeZoom ? layer.maxNativeZoom : 22}
              bounds={layer.bounds}
            />
          )
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
