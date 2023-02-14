import React, { useState, useEffect, useRef } from 'react';
import { useWatch, useController } from 'react-hook-form';
import { MapContainer, useMap, useMapEvent } from 'react-leaflet';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';
import { useDebounce } from '../../../../hooks';
import { defaultCoord, defaultZoom } from '../../../../conf/config';
import LayersControl from '../../../common/Maps/common/LayersControl';

const StyledMapContainer = styled(MapContainer)`
  margin: 0 4px;

  .centralMarker {
    z-index: 1000;
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
const MapBind = ({ center, onMoveEnd }) => {
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
    map.setView(center, map.getZoom(), { animate: false });
  }, [center, map]);

  return null;
};
MapBind.propTypes = {
  center: PropTypes.shape({}),
  onMoveEnd: PropTypes.func
};

const boundMinMax = (min, max, value) => Math.max(min, Math.min(max, value));
const toFloat = value => {
  let v = value ?? '';
  if (typeof v == 'string') v = v.replace(',', '.');
  return parseFloat(v);
};

const MapMarkerSelector = ({ control, formLatitudeKey, formLongitudeKey }) => {
  const DEBOUNCE_TIME_MS = 300;
  const lastSetFormTs = useRef(0);
  const [currentPosition, setCurrentPosition] = useState(defaultCoord);

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
    const shouldUpdate = !isNaN(validLatitude) && !isNaN(validLongitude);

    if (shouldUpdate && timeSinceSetFormMs > DEBOUNCE_TIME_MS + 100) {
      setCurrentPosition({ lat: validLatitude, lng: validLongitude });
    }
  }, [validLatitude, validLongitude]);

  // Binding form <- map
  const onMoveEnd = newLocation => {
    lastSetFormTs.current = Date.now();
    setFormLatitude(newLocation.lat.toFixed(6));
    setFormLongitude(newLocation.lng.toFixed(6));
  };

  return (
    <StyledMapContainer
      style={{ height: '40vh', width: 'calc(100% - 8px)' }}
      center={currentPosition}
      zoom={defaultZoom}
      dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
      scrollWheelZoom="center" // To avoid losing the coordinate when only zooming
      doubleClickZoom="center"
      touchZoom="center"
      preferCanvas>
      <LayersControl />

      <MapBind center={currentPosition} onMoveEnd={onMoveEnd} />

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
