import React, { useState, useEffect, useRef } from 'react';
import { useWatch, useController } from 'react-hook-form';
import {
  Circle,
  MapContainer,
  useMap,
  useMapEvent,
  ScaleControl
} from 'react-leaflet';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';
import { styled } from '@mui/material/styles';
import { entranceMarkerIcon } from '../../../../assets/icons';
import LayersControl from '../../../common/Maps/common/LayersControl';
import LocateMeControl from '../../../common/Maps/common/LocateMeControl';
import GeocodingControl from '../../../common/Maps/common/GeocodingControl';
import FullscreenControl from '../../../common/Maps/common/FullscreenControl';
import { defaultCoord, defaultZoom, focusZoom } from '../../../../conf/config';

const StyledMapContainer = styled(MapContainer)`
  margin: 0 4px;

  .centralMarker {
    z-index: 900;
    position: absolute;
    text-align: center;
    width: 100%;
    height: 100%;
    top: calc(50% - 60px);
  }

  .centralMarker img {
    height: 60px;
  }
`;

// Needed because useMap is only accessible from inside <MapContainer>
const MapBind = ({ center, zoom, onMoveEnd }) => {
  const lastValidCenter = useRef({});
  const lastSetViewTs = useRef(0);
  const map = useMap();

  useMapEvent('moveend', () => {
    // Prevent dispatching a onMoveEnd event triggered by setView below
    const timeSinceSetViewMs = Date.now() - lastSetViewTs.current;
    if (timeSinceSetViewMs > 50) {
      const mapCenter = map.getCenter();
      lastValidCenter.current = { lat: mapCenter.lat, lng: mapCenter.lng };
      onMoveEnd(mapCenter);
    }
  });

  useMapEvent('zoomend', () => {
    if (!isMobile) {
      // To avoid drift when zooming on desktop, we reset the map to the last known valid center
      lastSetViewTs.current = Date.now();
      map.setView(lastValidCenter.current, map.getZoom(), { animate: false });
    }
  });

  useEffect(() => {
    lastValidCenter.current = center;
    lastSetViewTs.current = Date.now();
    map.setView(center, zoom, { animate: false });
  }, [center, zoom, map]);

  return null;
};
MapBind.propTypes = {
  center: PropTypes.shape({}),
  zoom: PropTypes.number,
  onMoveEnd: PropTypes.func
};

const boundMinMax = (min, max, value) => Math.max(min, Math.min(max, value));
const toFloat = value => {
  let v = value ?? '';
  if (typeof v === 'string') v = v.replace(',', '.');
  return parseFloat(v);
};

const LOCATE_ZOOM = 18;
// How long after the map writes to the form before we allow form→map updates.
// Prevents the map pan → form update → map recenter loop.
const MAP_WRITE_GUARD_MS = 400;
const hasGeolocation = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
const ACCURACY_CIRCLE_STYLE = {
  color: '#1976d2',
  fillColor: '#1976d2',
  fillOpacity: 0.1,
  weight: 1
};

const MapMarkerSelector = ({ control, formLatitudeKey, formLongitudeKey }) => {
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(defaultCoord);
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const lastSetFormTs = useRef(0);

  const rawLatitude = useWatch({ control, name: formLatitudeKey });
  const rawLongitude = useWatch({ control, name: formLongitudeKey });

  const {
    field: { onChange: setFormLatitude }
  } = useController({ control, name: formLatitudeKey });
  const {
    field: { onChange: setFormLongitude }
  } = useController({ control, name: formLongitudeKey });

  const validLatitude = boundMinMax(-90, 90, toFloat(rawLatitude));
  const validLongitude = boundMinMax(-180, 180, toFloat(rawLongitude));

  // One-time initialization from pre-filled form values (edit form)
  useEffect(() => {
    if (
      !initialized &&
      !Number.isNaN(validLatitude) &&
      !Number.isNaN(validLongitude)
    ) {
      setCurrentPosition({ lat: validLatitude, lng: validLongitude });
      setZoomLevel(focusZoom);
      setInitialized(true);
    }
  }, [initialized, validLatitude, validLongitude]);

  // form → map: recentre when user edits lat/lng fields manually.
  // `initialized` is intentionally omitted from deps: we read its current value
  // as a guard but only want this effect to fire on coordinate changes, not on
  // the initialization transition (which is already handled by the effect above).
  useEffect(() => {
    if (!initialized) return;
    const isValid =
      !Number.isNaN(validLatitude) && !Number.isNaN(validLongitude);
    if (isValid && Date.now() - lastSetFormTs.current > MAP_WRITE_GUARD_MS) {
      setCurrentPosition({ lat: validLatitude, lng: validLongitude });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validLatitude, validLongitude]);

  // map → form (only direction after initialization)
  const onMoveEnd = newLocation => {
    lastSetFormTs.current = Date.now();
    setFormLatitude(newLocation.lat.toFixed(6));
    setFormLongitude(newLocation.lng.toFixed(6));
  };

  const handleLocateMe = () => {
    setLocating(true);
    setLocateError(null);
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setFormLatitude(loc.lat.toFixed(6));
        setFormLongitude(loc.lng.toFixed(6));
        setCurrentPosition(loc);
        setLocationAccuracy(pos.coords.accuracy);
        setZoomLevel(LOCATE_ZOOM);
        setLocating(false);
      },
      err => {
        setLocateError(err.code);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  return (
    <StyledMapContainer
      style={{ height: '40dvh', width: 'calc(100% - 8px)' }}
      center={currentPosition}
      zoom={zoomLevel}
      dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
      scrollWheelZoom="center" // To avoid losing the coordinate when only zooming
      doubleClickZoom="center"
      touchZoom={true}
      preferCanvas>
      <GeocodingControl
        onLocationSelect={newLocation => {
          setFormLatitude(newLocation.lat.toFixed(6));
          setFormLongitude(newLocation.lng.toFixed(6));
          setCurrentPosition({ lat: newLocation.lat, lng: newLocation.lng });
          setZoomLevel(focusZoom);
        }}
      />
      <FullscreenControl forceSeparateButton="true" />
      <ScaleControl position="bottomright" />
      <LayersControl />

      <MapBind
        center={currentPosition}
        zoom={zoomLevel}
        onMoveEnd={onMoveEnd}
      />

      {locationAccuracy && (
        <Circle
          center={currentPosition}
          radius={locationAccuracy}
          pathOptions={ACCURACY_CIRCLE_STYLE}
        />
      )}

      {hasGeolocation && (
        <LocateMeControl
          onClick={handleLocateMe}
          loading={locating}
          error={locateError}
        />
      )}

      <span className="centralMarker">
        <img alt="Entry" src={entranceMarkerIcon} />
      </span>
    </StyledMapContainer>
  );
};

MapMarkerSelector.propTypes = {
  control: PropTypes.shape({}),
  formLatitudeKey: PropTypes.string,
  formLongitudeKey: PropTypes.string
};

export default MapMarkerSelector;
