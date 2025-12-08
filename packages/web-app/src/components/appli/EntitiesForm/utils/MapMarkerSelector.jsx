import React, { useState, useEffect, useRef } from 'react';
import { useWatch, useController } from 'react-hook-form';
import { MapContainer, useMap, useMapEvent, ScaleControl } from 'react-leaflet';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useDebounce } from '../../../../hooks';
import useGeolocation from '../../../../hooks/useGeolocation';
import LayersControl from '../../../common/Maps/common/LayersControl';
import LocateControl from '../../../common/Maps/common/LocateControl';
import ConverterControl from '../../../common/Maps/common/Converter';
import GeocodingControl from '../../../common/Maps/common/GeocodingControl';
import { fetchProjections } from '../../../../actions/Projections';
import { defaultZoom, focusZoom } from '../../../../conf/config';

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
    // To avoid drift when zooming, we reset the map to the last known valid center
    lastSetViewTs.current = Date.now();
    map.setView(lastValidCenter.current, map.getZoom(), { animate: false });
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

const MapMarkerSelector = ({ control, formLatitudeKey, formLongitudeKey }) => {
  const DEBOUNCE_TIME_MS = 300;
  const lastSetFormTs = useRef(0);
  const { location: geoLocation, hasError: geoHasError } = useGeolocation();
  const [currentPosition, setCurrentPosition] = useState(geoLocation);
  const [shouldUpdate, setShouldUpdate] = useState(false);
  const dispatch = useDispatch();
  const { projections } = useSelector(state => state.projections);

  useEffect(() => {
    dispatch(fetchProjections());
  }, [dispatch]);

  const latitude = useDebounce(
    useWatch({ control, name: formLatitudeKey }),
    DEBOUNCE_TIME_MS
  );
  const longitude = useDebounce(
    useWatch({ control, name: formLongitudeKey }),
    DEBOUNCE_TIME_MS
  );
  const {
    field: { onChange: setFormLatitude }
  } = useController({ control, name: formLatitudeKey });
  const {
    field: { onChange: setFormLongitude }
  } = useController({ control, name: formLongitudeKey });

  const validLatitude = boundMinMax(-90, 90, toFloat(latitude));
  const validLongitude = boundMinMax(-180, 180, toFloat(longitude));

  // Binding form -> map
  useEffect(() => {
    // Prevent dispatching a setCurrentPosition event triggered by a setForm below
    const timeSinceSetFormMs = Date.now() - lastSetFormTs.current;
    const isValid =
      !Number.isNaN(validLatitude) && !Number.isNaN(validLongitude);

    if (isValid && timeSinceSetFormMs > DEBOUNCE_TIME_MS + 100) {
      setCurrentPosition({ lat: validLatitude, lng: validLongitude });
      setShouldUpdate(true);
    } else {
      setCurrentPosition(geoLocation);
      setShouldUpdate(false);
    }
  }, [validLatitude, validLongitude, geoLocation]);

  // Binding form <- map
  const onMoveEnd = newLocation => {
    lastSetFormTs.current = Date.now();
    setFormLatitude(newLocation.lat.toFixed(6));
    setFormLongitude(newLocation.lng.toFixed(6));
  };

  const ZOOM_LEVEL = shouldUpdate ? focusZoom : (geoHasError ? defaultZoom : focusZoom);

  return (
    <StyledMapContainer
      style={{ height: '40vh', width: 'calc(100% - 8px)' }}
      center={currentPosition}
      zoom={ZOOM_LEVEL}
      dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
      scrollWheelZoom="center" // To avoid losing the coordinate when only zooming
      doubleClickZoom="center"
      touchZoom="center"
      preferCanvas>
      <GeocodingControl onLocationSelect={newLocation => {
        setFormLatitude(newLocation.lat.toFixed(6));
        setFormLongitude(newLocation.lng.toFixed(6));
      }} />
      <LocateControl />
      <ScaleControl position="bottomright" />
      <LayersControl />
      <ConverterControl projectionsList={projections} hideOutput />

      <MapBind center={currentPosition} zoom={ZOOM_LEVEL} onMoveEnd={onMoveEnd} />

      <span className="centralMarker">
        <img
          alt="Entry"
          src="../../../../../../../../images/iconsV3/map/entry.svg"
        />
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
