import React, { useState, useEffect } from 'react';
import { head, pluck } from 'ramda';
import {
  LayerGroup,
  LayersControl as LeafletLayersControl,
  TileLayer,
  WMSTileLayer,
  useMap
} from 'react-leaflet';
import PropTypes from 'prop-types';
import * as L from 'leaflet';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';

import layers from './mapLayers';
import CustomControl from './CustomControl';

const possibleLayers = pluck('name', layers);
const localStorageBaseLayer = possibleLayers.find(
  name => name === window.localStorage.getItem('selectedBaseLayer')
);
const selectedBaseLayer = localStorageBaseLayer || head(possibleLayers);
const localStorageOpacity = parseFloat(window.localStorage.getItem('layerOpacity'));
const selectedOpacity = !isNaN(localStorageOpacity) ? localStorageOpacity : 1;

const createWMTSTileLayer = (layer, opacity = 1) => (
  <TileLayer
    attribution={layer.attribution}
    url={layer.url}
    minZoom={layer.minZoom}
    maxZoom={layer.maxZoom ?? 22}
    maxNativeZoom={layer.maxNativeZoom ?? 22}
    bounds={layer.bounds ?? new L.LatLngBounds(new L.LatLng(-90, -180), new L.LatLng(90, 180))}
    opacity={opacity}
  />
);

const createWMSTileLayer = (layer, opacity = 1) => (
  <WMSTileLayer
    attribution={layer.attribution}
    layers={layer.layers}
    url={layer.url}
    opacity={opacity}
  />
);

const OSM_LAYER = layers[0];
const OSM_TILE_LAYER = createWMTSTileLayer(OSM_LAYER);

const BaseMapLayer = ({ layer, opacity }) => (
  <LayerGroup>
    {OSM_TILE_LAYER}
    {layer !== OSM_LAYER && (
      <>
        {layer.type === 'WMTS' && createWMTSTileLayer(layer, opacity)}
        {layer.type === 'WMS' && createWMSTileLayer(layer, opacity)}
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
  }).isRequired,
  opacity: PropTypes.number
};

const ControlContainer = styled('div')(({ isExpanded }) => ({
  background: 'white',
  padding: '5px',
  width: isExpanded ? '200px' : 'min-content',
  transition: 'max-height 0.2s ease-in-out, width 0.2s ease-in-out',
  overflow: 'hidden',
  maxHeight: isExpanded ? '100px' : '28px'
}));

const ControlLabel = styled('label')(({ isExpanded }) => ({
  fontSize: '12px',
  display: 'block',
  marginBottom: isExpanded ? '5px' : '0',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  width: isExpanded ? 'auto' : 'fit-content'
}));

const OpacitySlider = styled('input')(({ theme, isExpanded }) => ({
  width: '100%',
  accentColor: theme.palette.primary.main,
  margin: '2px',
  transition: 'opacity 0.2s ease-in-out',
  opacity: isExpanded ? 1 : 0,
  pointerEvents: isExpanded ? 'auto' : 'none'
}));

const OpacityControl = ({ position, opacity, setOpacity }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { formatMessage } = useIntl();

  return (
    <CustomControl position={position} useLeafletControl>
      <ControlContainer 
        isExpanded={isExpanded}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}>
        <ControlLabel isExpanded={isExpanded}>
          {formatMessage({ id: 'Opacity' })}
        </ControlLabel>
        <OpacitySlider
          type="range"
          min="0"
          max="100"
          value={opacity * 100}
          onChange={(e) => setOpacity(e.target.value / 100)}
          isExpanded={isExpanded}
        />
      </ControlContainer>
    </CustomControl>
  );
};

OpacityControl.propTypes = {
  position: PropTypes.string.isRequired,
  opacity: PropTypes.number.isRequired,
  setOpacity: PropTypes.func.isRequired
};

const LayersControl = ({
  position = 'topleft',
  initialLayerChecked = selectedBaseLayer
}) => {
  const [opacity, setOpacity] = useState(selectedOpacity);
  const [currentLayer, setCurrentLayer] = useState(initialLayerChecked);
  const map = useMap();

  useEffect(() => {
    window.localStorage.setItem('layerOpacity', opacity);
  }, [opacity]);

  useEffect(() => {
    const handleLayerChange = (e) => {
      setCurrentLayer(e.name);
      window.localStorage.setItem('selectedBaseLayer', e.name);
    };

    map.on('baselayerchange', handleLayerChange);

    return () => {
      map.off('baselayerchange', handleLayerChange);
    };
  }, [map]);

  return (
    <>
      <LeafletLayersControl position={position}>
        {layers.map(layer => (
          <LeafletLayersControl.BaseLayer
            key={layer.name}
            checked={layer.name === initialLayerChecked}
            name={layer.name}>
            <BaseMapLayer layer={layer} opacity={opacity} />
          </LeafletLayersControl.BaseLayer>
        ))}
      </LeafletLayersControl>
      {currentLayer !== OSM_LAYER.name && (
        <OpacityControl key={currentLayer} position={position} opacity={opacity} setOpacity={setOpacity} />
      )}
    </>
  );
};

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
