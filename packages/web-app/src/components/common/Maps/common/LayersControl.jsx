import React, { useState, useEffect, useMemo } from 'react';
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
import { LAYER_ROLE } from './layerEnums';
import CustomControl from './CustomControl';

const possibleLayers = pluck('name', layers);
const localStorageBaseLayer = possibleLayers.find(
  name => name === window.localStorage.getItem('selectedBaseLayer')
);
const selectedBaseLayer = localStorageBaseLayer || head(possibleLayers);
const getStoredOverlays = () => {
  try {
    const stored = window.localStorage.getItem('selectedOverlays');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};
const selectedOverlays = getStoredOverlays();
const localStorageOpacity = parseFloat(window.localStorage.getItem('layerOpacity'));
const selectedOpacity = !isNaN(localStorageOpacity) ? localStorageOpacity : 1;

const usePanes = (layers) => {
  const map = useMap();

  useEffect(() => {
    const panes = [...new Set(layers.map(l => l.pane).filter(Boolean))];
    // When the map is rotatable (leaflet-rotate), custom tile panes must be
    // created inside the rotatePane. Otherwise Leaflet attaches them to the
    // mapPane — a sibling of the rotatePane — so their tiles stay north-up
    // while overlays/markers rotate. Falls back to the default parent when the
    // map has no rotation enabled.
    const rotatePane = map.getPane('rotatePane');

    panes.forEach((paneName, index) => {
      if (!map.getPane(paneName)) {
        const pane = map.createPane(paneName, rotatePane || undefined);
        pane.style.zIndex = 200 + index * 10;
      }
    });
  }, [map, layers]);
};

const createWMTSTileLayer = (layer, opacity = 1) => (
  <TileLayer
    pane={layer.pane}
    attribution={layer.attribution}
    url={layer.url}
    minZoom={layer.minZoom}
    maxZoom={layer.maxZoom ?? 22}
    maxNativeZoom={layer.maxNativeZoom ?? 22}
    bounds={layer.bounds ?? new L.LatLngBounds(new L.LatLng(-90, -180), new L.LatLng(90, 180))}
    opacity={opacity}
    referrerPolicy={layer.referrerPolicy}
  />
);

const createWMSTileLayer = (layer, opacity = 1) => {
  const {
    url,
    layers: wmsLayers,
    styles = '',
    format = 'image/png',
    transparent = true,
    version = '1.3.0'
  } = layer;

  return (
    <WMSTileLayer
      pane={layer.pane}
      url={url}
      layers={wmsLayers}
      styles={styles}
      format={format}
      transparent={transparent}
      version={version}
      opacity={opacity}
    />
  );
};

const renderLayer = (layer, opacity) => {
  if (layer.type === 'WMTS') return createWMTSTileLayer(layer, opacity);
  if (layer.type === 'WMS') return createWMSTileLayer(layer, opacity);
  return null;
};

const OpacityControlContainer = styled('div')(({ isExpanded }) => ({
  background: 'white',
  padding: '5px',
  width: isExpanded ? '200px' : 'min-content',
  transition: 'max-height 0.2s ease-in-out, width 0.2s ease-in-out',
  overflow: 'hidden',
  maxHeight: isExpanded ? '100px' : '28px'
}));

const OpacityControlLabel = styled('label')(({ isExpanded }) => ({
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
      <OpacityControlContainer
        isExpanded={isExpanded}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}>
        <OpacityControlLabel isExpanded={isExpanded}>
          {formatMessage({ id: 'Opacity' })}
        </OpacityControlLabel>
        <OpacitySlider
          type="range"
          min="0"
          max="100"
          value={opacity * 100}
          onChange={(e) => setOpacity(e.target.value / 100)}
          isExpanded={isExpanded}
        />
      </OpacityControlContainer>
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
                         initialSelectedBaseLayer = selectedBaseLayer,
                         initialSelectedOverlays = selectedOverlays
                       }) => {
  const [opacity, setOpacity] = useState(selectedOpacity);
  const [currentBaseLayer, setCurrentBaseLayer] = useState(initialSelectedBaseLayer);
  const [currentOverlays, setCurrentOverlays] = useState(initialSelectedOverlays);
  const [isMapReady, setIsMapReady] = useState(false);
  const map = useMap();

  useEffect(() => {
    if (map && map.getContainer()) {
      setIsMapReady(true);
    }
  }, [map]);

  usePanes(layers);

  useEffect(() => {
    window.localStorage.setItem('layerOpacity', opacity);
  }, [opacity]);

  const baseLayers = useMemo(
    () => layers.filter(l => l.role === LAYER_ROLE.BASE),
    []
  );

  const overlayLayers = useMemo(
    () => layers.filter(l => l.role === LAYER_ROLE.OVERLAY),
    []
  );

  useEffect(() => {
    const onChange = (e) => {
      setCurrentBaseLayer(e.name);
      window.localStorage.setItem('selectedBaseLayer', e.name);
    };
    map.on('baselayerchange', onChange);

    return () => {
      map.off('baselayerchange', onChange);
    };
  }, [map]);

  useEffect(() => {
    const onAdd = (e) => {
      setCurrentOverlays(prev => {
        const updated = Array.isArray(prev) ? [...prev, e.name] : [e.name];
        window.localStorage.setItem('selectedOverlays', JSON.stringify(updated));
        return updated;
      });
    };
    const onRemove = (e) => {
      setCurrentOverlays(prev => {
        const updated = Array.isArray(prev) ? prev.filter(name => name !== e.name) : [];
        if (updated.length > 0) {
          window.localStorage.setItem('selectedOverlays', JSON.stringify(updated));
        } else {
          window.localStorage.removeItem('selectedOverlays');
        }
        return updated.length > 0 ? updated : null;
      });
    };
    map.on('overlayadd', onAdd);
    map.on('overlayremove', onRemove);

    return () => {
      map.off('overlayadd', onAdd);
      map.off('overlayremove', onRemove);
    };
  }, [map]);

  if (!isMapReady) return null;

  return (
    <>
      <LeafletLayersControl position={position}>
        {baseLayers.map(layer => (
          <LeafletLayersControl.BaseLayer
            key={layer.id}
            checked={layer.name === initialSelectedBaseLayer}
            name={layer.name}
          >
            {renderLayer(layer, 1)}
          </LeafletLayersControl.BaseLayer>
        ))}
        {overlayLayers.map(layer => (
          <LeafletLayersControl.Overlay
            key={layer.id}
            name={layer.name}
            checked={Array.isArray(initialSelectedOverlays) && initialSelectedOverlays.includes(layer.name)}
          >
            <LayerGroup>
              {renderLayer(layer, opacity)}
            </LayerGroup>
          </LeafletLayersControl.Overlay>
        ))}
      </LeafletLayersControl>
      {currentOverlays?.length > 0 && <OpacityControl key={currentBaseLayer} position={position} opacity={opacity} setOpacity={setOpacity} />}
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
  initialSelectedBaseLayer: PropTypes.oneOf(possibleLayers),
  initialSelectedOverlays: PropTypes.arrayOf(PropTypes.oneOf(possibleLayers))
};

export default LayersControl;
