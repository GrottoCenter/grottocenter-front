import { useState, useEffect, useRef, useCallback } from 'react';
import { useWatch } from 'react-hook-form';
import { useIntl } from 'react-intl';
import {
  Circle,
  MapContainer,
  useMap,
  useMapEvent,
  ScaleControl
} from 'react-leaflet';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';
import { alpha, styled } from '@mui/material/styles';
import { orange } from '@mui/material/colors';
import { Box } from '@mui/material';
import { ACCURACY_CIRCLE_STYLE } from '@/components/common/Maps/common/userLocationStyle';
import { entranceMarkerIcon } from '../../../../assets/icons';
import useMarkers from '../../../common/Maps/common/Markers/useMarkers';
import { EntrancePopup } from '../../../common/Maps/common/Markers/Components';
import LayersControl from '../../../common/Maps/common/LayersControl';
import LocateMeControl from '../../../common/Maps/common/LocateMeControl';
import GeocodingControl from '../../../common/Maps/common/GeocodingControl';
import FullscreenControl from '../../../common/Maps/common/FullscreenControl';
import TileReloader from '../../../common/Maps/common/TileReloader';
import { defaultCoord, defaultZoom, focusZoom } from '../../../../conf/config';

const StyledMapContainer = styled(MapContainer)`
  .centralMarker {
    z-index: 900;
    position: absolute;
    text-align: center;
    width: 100%;
    height: 100%;
    top: calc(50% - 60px);
    /* Purely decorative center pin: let hover/click reach the markers below. */
    pointer-events: none;
  }

  .centralMarker img {
    height: 60px;
  }
`;

// Needed because useMap is only accessible from inside <MapContainer>
// How long after a container resize we ignore the ensuing `moveend`. When the
// map is sized in viewport units, a resize (mobile toolbar show/hide on scroll,
// orientation change, virtual keyboard) changes its height. Leaflet keeps the
// same center but re-projects it, and the pixel rounding makes getCenter() drift
// slightly — writing that back would silently move the coordinates. The default
// height uses `svh` (stable across toolbar show/hide) to avoid the scroll case.
const RESIZE_GUARD_MS = 500;

const MapBind = ({ center, zoom, onMoveEnd }) => {
  const lastValidCenter = useRef({});
  const lastSetViewTs = useRef(0);
  const lastResizeTs = useRef(0);
  const isUserDragging = useRef(false);
  const map = useMap();

  useMapEvent('dragstart', () => {
    isUserDragging.current = true;
  });

  useMapEvent('resize', () => {
    lastResizeTs.current = Date.now();
  });

  useMapEvent('moveend', () => {
    // Ignore moveend events not initiated by the user: those triggered by the
    // programmatic setView below, and those triggered by a container resize.
    const timeSinceSetViewMs = Date.now() - lastSetViewTs.current;
    const timeSinceResizeMs = Date.now() - lastResizeTs.current;
    if (
      isUserDragging.current ||
      (timeSinceSetViewMs > 50 && timeSinceResizeMs > RESIZE_GUARD_MS)
    ) {
      isUserDragging.current = false;
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

// Reports the map zoom upward so the parent can hide the duplicate-detection
// markers when the map is zoomed out too far. Listens to `moveend` (not just
// `zoomend`) because programmatic re-centring on coordinate entry changes the
// zoom via setView, which reliably emits `moveend`. Also emits the initial zoom.
const ZoomReporter = ({ onZoomChange }) => {
  const map = useMap();
  // Keep the latest callback in a ref so the listeners and mount effect below
  // depend only on `map`, never on the callback's identity. A parent passing an
  // inline arrow would otherwise re-subscribe the listeners on every render and
  // re-run the mount effect — looping if that callback sets state. `report` is
  // memoised on `map` alone, so it stays stable across the parent's renders.
  const onZoomChangeRef = useRef(onZoomChange);
  onZoomChangeRef.current = onZoomChange;

  const report = useCallback(
    () => onZoomChangeRef.current(map.getZoom()),
    [map]
  );
  useMapEvent('moveend', report);
  useMapEvent('zoomend', report);
  useEffect(() => {
    report(); // Emit the initial zoom on mount.
  }, [report]);
  return null;
};
ZoomReporter.propTypes = {
  onZoomChange: PropTypes.func.isRequired
};

const boundMinMax = (min, max, value) => Math.max(min, Math.min(max, value));
const toFloat = value => {
  let v = value ?? '';
  if (typeof v === 'string') v = v.replace(',', '.');
  return parseFloat(v);
};

// Existing nearby entrances are drawn as distinctly-coloured circles so they
// are not mistaken for the user's new entrance (the large central pin).
const NEARBY_ENTRANCE_MARKER_STYLE = {
  radius: 8,
  color: '#FFFFFF',
  weight: 2,
  fillColor: '#D32F2F',
  fillOpacity: 0.9
};

// Module-level: stable reference so useMarkers's useCallback deps don't change,
// and so the popup renderer is not redefined on every render — React would see a
// new component type each time and throw away the popup's DOM.
const NEARBY_ENTRANCE_MARKER_OPTIONS = {
  circleMarkerStyle: NEARBY_ENTRANCE_MARKER_STYLE,
  tooltipContent: entrance => entrance?.name,
  popupContent: entrance => <EntrancePopup entrance={entrance} />
};

const AdditionalMarkers = ({ positions }) => {
  const updateMarkers = useMarkers(NEARBY_ENTRANCE_MARKER_OPTIONS);

  useEffect(() => {
    updateMarkers(positions);
  }, [positions, updateMarkers]);

  return null;
};
AdditionalMarkers.propTypes = {
  positions: PropTypes.arrayOf(PropTypes.shape({})).isRequired
};

const LOCATE_ZOOM = 18;
// How long after the map writes to the form before we allow form→map updates.
// Prevents the map pan → form update → map recenter loop.
const MAP_WRITE_GUARD_MS = 400;
const hasGeolocation =
  typeof navigator !== 'undefined' && Boolean(navigator.geolocation);
const ENTRANCE_ACCURACY_COLOR = orange[700];
const ENTRANCE_ACCURACY_CIRCLE_STYLE = {
  ...ACCURACY_CIRCLE_STYLE,
  color: ENTRANCE_ACCURACY_COLOR,
  fillColor: ENTRANCE_ACCURACY_COLOR
};

const MapMarkerSelector = ({
  control,
  formLatitudeKey,
  formLongitudeKey,
  onLatitudeChange: setFormLatitude,
  onLongitudeChange: setFormLongitude,
  formAccuracyKey,
  additionalPositions = [],
  additionalMarkersLabel,
  onZoomChange,
  onLocationAccuracyChange,
  markerIcon,
  mapHeight = '40svh'
}) => {
  const { formatMessage } = useIntl();
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(defaultCoord);
  const [zoomLevel, setZoomLevel] = useState(defaultZoom);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const lastSetFormTs = useRef(0);

  const rawLatitude = useWatch({ control, name: formLatitudeKey });
  const rawLongitude = useWatch({ control, name: formLongitudeKey });
  const formAccuracy = useWatch({
    control,
    name: formAccuracyKey,
    disabled: !formAccuracyKey
  });

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
        // The API stores whole meters; round up rather than understate the
        // device estimate. Zero is reserved for restricted coordinates.
        const { accuracy } = pos.coords;
        onLocationAccuracyChange?.(
          Number.isFinite(accuracy) && accuracy >= 0
            ? Math.max(1, Math.ceil(accuracy))
            : null
        );
        setZoomLevel(LOCATE_ZOOM);
        setLocating(false);
      },
      err => {
        setLocateError(err.code);
        setLocating(false);
      },
      // Repeated taps may reuse a fix for up to half a second, keeping both
      // coordinates and accuracy current while avoiding immediate reacquisition.
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 500 }
    );
  };

  const accuracyRadius = Number(
    formAccuracyKey ? formAccuracy : locationAccuracy
  );
  const hasAccuracyCircle =
    Number.isFinite(accuracyRadius) &&
    accuracyRadius > 0 &&
    !Number.isNaN(validLatitude) &&
    !Number.isNaN(validLongitude);
  const showAccuracyLegend = Boolean(formAccuracyKey) && hasAccuracyCircle;
  const showNearbyLegend =
    additionalMarkersLabel && additionalPositions.length > 0;

  return (
    <Box sx={{ position: 'relative' }}>
      <StyledMapContainer
        style={{ height: mapHeight, width: '100%' }}
        center={currentPosition}
        zoom={zoomLevel}
        dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
        scrollWheelZoom="center" // To avoid losing the coordinate when only zooming
        doubleClickZoom="center"
        touchZoom
        rotateControl={false}
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
        <LayersControl position="topright" />
        <TileReloader />

        <MapBind
          center={currentPosition}
          zoom={zoomLevel}
          onMoveEnd={onMoveEnd}
        />

        {onZoomChange && <ZoomReporter onZoomChange={onZoomChange} />}

        {hasAccuracyCircle && (
          <Circle
            center={{ lat: validLatitude, lng: validLongitude }}
            radius={accuracyRadius}
            interactive={false}
            pathOptions={
              formAccuracyKey
                ? ENTRANCE_ACCURACY_CIRCLE_STYLE
                : ACCURACY_CIRCLE_STYLE
            }
          />
        )}

        {hasGeolocation && (
          <LocateMeControl
            onClick={handleLocateMe}
            loading={locating}
            error={locateError}
          />
        )}

        {additionalPositions.length > 0 && (
          <AdditionalMarkers positions={additionalPositions} />
        )}

        <span className="centralMarker">
          <img alt="Entry" src={markerIcon || entranceMarkerIcon} />
        </span>

        {/* Rendered inside the map container so it stays visible in fullscreen
            mode (only the map element enters fullscreen). */}
        {(showNearbyLegend || showAccuracyLegend) && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              left: 12,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0.5,
              px: 0.5,
              py: 0.5,
              borderRadius: 1,
              boxShadow: 1,
              fontSize: 12,
              color: 'text.primary',
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              pointerEvents: 'none'
            }}>
            {showNearbyLegend && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    flexShrink: 0,
                    borderRadius: '50%',
                    border: `2px solid ${NEARBY_ENTRANCE_MARKER_STYLE.color}`,
                    bgcolor: NEARBY_ENTRANCE_MARKER_STYLE.fillColor
                  }}
                />
                {additionalMarkersLabel}
              </Box>
            )}
            {showAccuracyLegend && (
              <Box
                data-testid="entrance-precision-legend"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75
                }}>
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    flexShrink: 0,
                    borderRadius: '50%',
                    border: `1px solid ${ENTRANCE_ACCURACY_CIRCLE_STYLE.color}`,
                    bgcolor: alpha(
                      ENTRANCE_ACCURACY_CIRCLE_STYLE.fillColor,
                      0.1
                    )
                  }}
                />
                {formatMessage({ id: 'Accuracy' })}
              </Box>
            )}
          </Box>
        )}
      </StyledMapContainer>
    </Box>
  );
};

MapMarkerSelector.propTypes = {
  control: PropTypes.shape({}),
  formLatitudeKey: PropTypes.string,
  formLongitudeKey: PropTypes.string,
  onLatitudeChange: PropTypes.func.isRequired,
  onLongitudeChange: PropTypes.func.isRequired,
  formAccuracyKey: PropTypes.string,
  additionalPositions: PropTypes.arrayOf(PropTypes.shape({})),
  additionalMarkersLabel: PropTypes.string,
  onZoomChange: PropTypes.func,
  onLocationAccuracyChange: PropTypes.func,
  markerIcon: PropTypes.string,
  mapHeight: PropTypes.string
};

export default MapMarkerSelector;
