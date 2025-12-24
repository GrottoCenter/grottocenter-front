import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import {
  MapContainer,
  useMap,
  useMapEvents,
  ScaleControl
} from 'react-leaflet';
import PropTypes from 'prop-types';
import LayersControl from './LayersControl';
import FullscreenControl from './FullscreenControl';
import LocateControl from './LocateControl';

const Wrapper = styled('div', {
  shouldForwardProp: (prop) => !prop.startsWith('$')
})(({ theme, $wholePage }) => `
  width: calc(100% - 10px);
  height: 400px;

  ${theme.breakpoints.up('md')} {
    ${!$wholePage && `margin-right: ${theme.spacing(2)};`}
  }
${$wholePage && `height: calc(100vh - ${theme.appBarHeight}px);`}
`);

// The Map, once mounted, doesn't change its center: this Centerer forces it
// See https://github.com/PaulLeCam/react-leaflet/issues/796#issuecomment-743181396
const Centerer = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const baseLayerChange = event => {
  window.localStorage.setItem('selectedBaseLayer', event.name);
};

const handleResize = map => {
  if (!map) return;
  const myObserver = new ResizeObserver(() => {
    setTimeout(() => {
      try {
          map.invalidateSize(true);
      } catch (e) {
          // Silently ignore errors during invalidateSize
      }
    }, 100);
  });
  myObserver.observe(map.getContainer());
  map.on('baselayerchange', baseLayerChange);
};

Centerer.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number
};

const FullscreenInteraction = ({ dragging, scrollWheelZoom }) => {
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(null);
  const map = useMapEvents({
    enterFullscreen() {
      setMapCenter(map.getCenter());
      setMapZoom(map.getZoom());
      map.dragging.enable();
      map.scrollWheelZoom.enable();
    },
    exitFullscreen() {
      map.setView(mapCenter, mapZoom, { animate: false });
      if (dragging) {
        map.dragging.enable();
      } else {
        map.dragging.disable();
      }
      if (scrollWheelZoom) {
        map.scrollWheelZoom.enable();
      } else {
        map.scrollWheelZoom.disable();
      }
    }
  });
  return <FullscreenControl forceSeparateButton="true" />;
};

FullscreenInteraction.propTypes = {
  dragging: PropTypes.bool,
  scrollWheelZoom: PropTypes.bool
};

const CustomMapContainer = ({
  wholePage = true,
  center,
  zoom,
  dragging = true,
  scrollWheelZoom = true,
  isSideMenuOpen = false,
  isLocateControl = false,
  isFullscreenAllowed = true,
  shouldChangeControlInFullscreen = true,
  style,
  children,
  forceCentering,
  mapRef
}) => (
  <Wrapper $wholePage={wholePage}>
    <MapContainer
      style={{ height: '100%', width: '100%', ...style }}
      wholePage={wholePage}
      center={center}
      zoom={zoom}
      dragging={dragging}
      scrollWheelZoom={scrollWheelZoom}
      isSideMenuOpen={isSideMenuOpen}
      minZoom={1}
      ref={(ref) => {
        handleResize(ref);
        if (mapRef) mapRef.current = ref;
      }}
      preferCanvas>
      {isFullscreenAllowed && shouldChangeControlInFullscreen && (
        <FullscreenInteraction dragging={dragging} scrollWheelZoom={scrollWheelZoom} />
      )}
      {isFullscreenAllowed && !shouldChangeControlInFullscreen && (
        <FullscreenControl forceSeparateButton="true" />
      )}
      {forceCentering && <Centerer center={center} zoom={zoom} />}
      {isLocateControl && <LocateControl />}
      <ScaleControl position="bottomright" />
      <LayersControl />
      {children}
    </MapContainer>
  </Wrapper>
);

CustomMapContainer.propTypes = {
  wholePage: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  dragging: PropTypes.bool,
  scrollWheelZoom: PropTypes.bool,
  children: PropTypes.node,
  isSideMenuOpen: PropTypes.bool,
  isLocateControl: PropTypes.bool,
  isFullscreenAllowed: PropTypes.bool,
  shouldChangeControlInFullscreen: PropTypes.bool,
  style: PropTypes.shape({}),
  forceCentering: PropTypes.bool,
  mapRef: PropTypes.shape({ current: PropTypes.any })
};

export default CustomMapContainer;
