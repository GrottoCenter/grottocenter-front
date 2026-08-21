import { useEffect, useState, useRef, useCallback } from 'react';
import { styled } from '@mui/material/styles';
import {
  MapContainer,
  useMap,
  useMapEvent,
  useMapEvents,
  ScaleControl
} from 'react-leaflet';
import PropTypes from 'prop-types';
// Ensure window.L is set before the plugin loads, then side-effect import that
// patches L.Map with rotation support (setBearing, rotate option). Order matters.
import './setupLeafletRotate';
import 'leaflet-rotate';
import LayersControl from './LayersControl';
import FullscreenControl from './FullscreenControl';
import LocationControl from './LocationControl';
import UserLocationMarker from './UserLocationMarker';
import TileReloader from './TileReloader';
import useIsFullscreen from './useIsFullscreen';
import { MapLocationProvider } from './MapLocationContext';

const Wrapper = styled('div', {
  shouldForwardProp: prop => !prop.startsWith('$')
})(
  ({ theme, $wholePage }) => `
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 400px;

${$wholePage && `height: calc(100vh - ${theme.appBarHeight}px); /* fallback for old browsers */`}
${$wholePage && `height: calc(100dvh - ${theme.appBarHeight}px);`}

  .leaflet-control-layers-list label {
    font-size: 14px;
  }

  .leaflet-top.leaflet-right {
    z-index: 1001;
  }
`
);

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

// Unified location control + user-position marker that only appear while the
// map is in fullscreen (the field-navigation context — e.g. entrance maps on
// mobile). The compass part of the control self-degrades on non-touch devices.
const FullscreenOnlyControls = () => {
  const map = useMap();
  const isFullscreen = useIsFullscreen();

  // Leaving fullscreen unmounts the location control; restore north-up so the
  // map isn't left rotated with no control to reset it. Registered even when
  // !isFullscreen (i.e. when this component renders null) since the listener
  // must already be in place before the exitFullscreen event fires.
  const handleExitFullscreen = useCallback(() => {
    if (typeof map.setBearing === 'function') map.setBearing(0);
  }, [map]);
  useMapEvent('exitFullscreen', handleExitFullscreen);

  if (!isFullscreen) return null;
  return (
    <>
      <LocationControl />
      <UserLocationMarker />
    </>
  );
};

const CustomMapContainer = ({
  wholePage = true,
  center,
  zoom,
  dragging = true,
  scrollWheelZoom = true,
  // Location control + user-dot: `Always` mounts them regardless of fullscreen
  // (used by the global map, which never enters fullscreen); `InFullscreen`
  // mounts them only while the map is fullscreen (embedded maps, e.g. on an
  // entrance page — a small inline map isn't a field-navigation context).
  isLocationControlAlways = false,
  isLocationControlInFullscreen = false,
  isFullscreenAllowed = true,
  shouldChangeControlInFullscreen = true,
  style,
  children,
  forceCentering,
  mapRef,
  renderer = null
}) => {
  const observerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pendingStabilizeRef = useRef(null);
  const mapRefPropRef = useRef(mapRef);
  mapRefPropRef.current = mapRef;

  const mapRefCallback = useCallback(map => {
    if (mapRefPropRef.current) mapRefPropRef.current.current = map;
    if (!map || map === mapInstanceRef.current) return;
    mapInstanceRef.current = map;

    // Clean up previous observer and any pending timeout
    clearTimeout(pendingStabilizeRef.current);
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const container = map.getContainer();

    // Two-phase resize handling:
    // Phase 1 (during transition): invalidateSize({ pan: false }) on every notification
    //   → Leaflet redraws tiles for the growing container without panning,
    //     so the map reveals more geographic area smoothly. No moveend fired.
    // Phase 2 (after transition): one invalidateSize({ animate: false }) once size
    //   settles → corrects the geographic center, fires moveend once.
    const observer = new ResizeObserver(() => {
      try {
        map.invalidateSize({ animate: false, pan: false });
      } catch {
        /* ignore */
      }
      clearTimeout(pendingStabilizeRef.current);
      pendingStabilizeRef.current = setTimeout(() => {
        pendingStabilizeRef.current = null;
        try {
          map.invalidateSize({ animate: false });
        } catch {
          /* ignore */
        }
      }, 100);
    });
    observer.observe(container);
    observerRef.current = observer;

    map.on('baselayerchange', baseLayerChange);
  }, []);

  // Disconnect observer and remove listeners on unmount
  useEffect(
    () => () => {
      clearTimeout(pendingStabilizeRef.current);
      observerRef.current?.disconnect();
      mapInstanceRef.current?.off('baselayerchange', baseLayerChange);
    },
    []
  );

  return (
    <Wrapper $wholePage={wholePage}>
      <MapContainer
        style={{ flex: '1 1 auto', minHeight: 0, width: '100%', ...style }}
        wholePage={wholePage}
        center={center}
        zoom={zoom}
        dragging={dragging}
        scrollWheelZoom={scrollWheelZoom}
        minZoom={1}
        rotate={isLocationControlAlways || isLocationControlInFullscreen}
        bearing={0}
        rotateControl={false}
        touchRotate={false}
        shiftKeyRotate={false}
        ref={mapRefCallback}
        renderer={renderer || undefined}
        preferCanvas={!renderer}>
        <MapLocationProvider>
          {isFullscreenAllowed && shouldChangeControlInFullscreen && (
            <FullscreenInteraction
              dragging={dragging}
              scrollWheelZoom={scrollWheelZoom}
            />
          )}
          {isFullscreenAllowed && !shouldChangeControlInFullscreen && (
            <FullscreenControl forceSeparateButton="true" />
          )}
          {forceCentering && <Centerer center={center} zoom={zoom} />}
          <TileReloader />
          {/* Bottom-right stack. Leaflet inserts each new bottom control above
              the previous one. */}
          <ScaleControl position="bottomright" />
          {isLocationControlAlways && (
            <>
              <LocationControl />
              <UserLocationMarker />
            </>
          )}
          {isLocationControlInFullscreen && <FullscreenOnlyControls />}
          <LayersControl position="topright" />
          {children}
        </MapLocationProvider>
      </MapContainer>
    </Wrapper>
  );
};

CustomMapContainer.propTypes = {
  wholePage: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  dragging: PropTypes.bool,
  scrollWheelZoom: PropTypes.bool,
  children: PropTypes.node,
  isLocationControlAlways: PropTypes.bool,
  isLocationControlInFullscreen: PropTypes.bool,
  isFullscreenAllowed: PropTypes.bool,
  shouldChangeControlInFullscreen: PropTypes.bool,
  style: PropTypes.shape({}),
  forceCentering: PropTypes.bool,
  mapRef: PropTypes.shape({ current: PropTypes.shape({}) }),
  // A Leaflet renderer instance (L.canvas() / L.svg()), not a plain object.
  renderer: PropTypes.shape({})
};

export default CustomMapContainer;
