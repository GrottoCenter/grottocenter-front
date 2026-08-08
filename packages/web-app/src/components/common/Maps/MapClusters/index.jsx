import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';

import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
  useMediaQuery
} from '@mui/material';
import { ContentCopy, LocationOn, Tune } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import GeocodingControl from '../common/GeocodingControl';
import MapTour from './MapTour';
import DataControl, { layerTypes } from './DataControl';
import {
  formatCoordinatesForCopy,
  formatWGS84
} from '../../../../helpers/coordinateConvert';
import copyToClipboard from '../../../../helpers/clipboard';
import {
  useNotification,
  useCoordinatePreference,
  useOnlineStatus,
  usePermissions,
  getCRSLabel
} from '../../../../hooks';
import useLocalStorage from '../../../../hooks/useLocalStorage';
import useWaypoint from '../../../../hooks/useWaypoint';
import { displayLoginDialog } from '../../../../actions/Login';
import { EntityIcon } from '../../../../pages/EntityCreation/entityConfig';
import CRSMenu from '../../CRSMenu';
import MeasureControl from '../common/MeasureControl';
import ClusterLayer, { ClusterGlobalCss } from './ClusterLayer';
import Markers from './Markers';
import MassifPolygons, { massifPolygonType } from './MassifPolygons';
import ExploredOverlay from './ExploredOverlay';
import OfflineDetailNotice from './OfflineDetailNotice';
import useExploredEntrances from './useExploredEntrances';
import PopupTargetHandler from './PopupTargetHandler';
import WaypointNavigation from '../common/Waypoint/WaypointNavigation';
import { WAYPOINT_COLOR } from '../common/Waypoint/waypointIcon';
import CustomMapContainer from '../common/MapContainer';
import {
  MARKERS_LIMIT,
  MASSIFS_POLYGON_LIMIT,
  ENTRANCE_MARKER_FILTERS,
  ENTRANCE_QUALITY_FILTERS,
  getCaveSize,
  getCaveQuality,
  CAVE_SIZE,
  CAVE_QUALITY
} from './constants';

const ZOOM_STATE = {
  MARKERS: 1,
  CLUSTER: 2
};

// Types that render as real markers at high zoom (via <Markers>). Massifs
// don't — they become polygons instead — so they never enter `visibleMarkers`.
const MARKER_LAYERS = [
  layerTypes.ENTRANCES,
  layerTypes.NETWORKS,
  layerTypes.ORGANIZATIONS
];

const DEFAULT_SELECTED_LAYERS = {
  [layerTypes.ENTRANCES]: true,
  [layerTypes.NETWORKS]: false,
  [layerTypes.MASSIFS]: false,
  [layerTypes.ORGANIZATIONS]: false
};

// Stable empty-array fallback for the projections selector — an inline `?? []`
// would return a fresh reference each render and trip useSelector's Object.is
// equality, forcing needless re-renders and a react-redux warning.
const EMPTY_PROJECTIONS = [];

const HydratedMap = ({
  entrances,
  entranceMarkers = [],
  networks,
  networkMarkers = [],
  organizations,
  organizationMarkers = [],
  massifs,
  massifPolygons = [],
  onUpdate,
  popupTarget = null
}) => {
  const map = useMap();
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();
  const { isAuth } = usePermissions();
  const isOnline = useOnlineStatus();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const projections = useSelector(
    state => state.projections?.projections ?? EMPTY_PROJECTIONS
  );
  const userId = useSelector(state => state.login.authTokenDecoded?.id ?? null);
  const [contextCoords, setContextCoords] = useState(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState(null);
  const [pendingEntranceUrl, setPendingEntranceUrl] = useState(null);
  const [formatMenuAnchor, setFormatMenuAnchor] = useState(null);
  const [preferred, setPref] = useCoordinatePreference();
  const isTouch = useMediaQuery('(pointer: coarse)');

  // Temporary navigation waypoint (mobile/touch only), shared with the
  // fullscreen entrance map through a single storage key — see useWaypoint.
  const [waypoint, setWaypoint] = useWaypoint();

  const [showExplored, setShowExplored] = useLocalStorage(
    'grottocenter_showExploredCaves',
    false,
    { serialize: v => String(v), deserialize: v => v === 'true' }
  );

  const { points: exploredPoints, hasExploredData } = useExploredEntrances({
    userId,
    enabled: showExplored && isAuth
  });

  const initialZoom = useRef(map.getZoom()).current;
  const isInitiallyZoomedIn = initialZoom >= MARKERS_LIMIT;

  // Single source of truth for which datasets the user wants visible on the
  // map. A layer being true → clusters at low zoom + real markers (or polygons
  // for massifs) at high zoom. The `merge: true` shields the state against
  // future schema evolution: newly-added layer types get their default without
  // wiping existing user preferences.
  const [selectedLayers, setSelectedLayers] = useLocalStorage(
    'grottocenter_selectedLayers',
    DEFAULT_SELECTED_LAYERS,
    { merge: true }
  );
  const toggleLayer = useCallback(
    type => {
      setSelectedLayers(prev => ({ ...prev, [type]: !prev[type] }));
    },
    [setSelectedLayers]
  );
  const [activeEntranceFilters, setActiveEntranceFilters] = useLocalStorage(
    'grottocenter_activeEntranceFilters',
    Object.fromEntries(Object.values(CAVE_SIZE).map(size => [size, true])),
    { merge: true }
  );
  const [activeQualityFilters, setActiveQualityFilters] = useLocalStorage(
    'grottocenter_activeQualityFilters',
    Object.fromEntries(Object.values(CAVE_QUALITY).map(q => [q, true])),
    { merge: true }
  );

  const filteredEntranceMarkers = useMemo(
    () =>
      entranceMarkers.filter(e => {
        if (!activeEntranceFilters[getCaveSize(e)]) return false;
        const quality = getCaveQuality(e);
        // Entrances without quality data are always shown
        if (quality === null) return true;
        return activeQualityFilters[quality];
      }),
    [entranceMarkers, activeEntranceFilters, activeQualityFilters]
  );

  // Marker-eligible layers currently selected — the set to fetch and render as
  // real markers whenever we're above MARKERS_LIMIT. Massifs never appear here
  // (they become polygons instead).
  const enabledMarkerLayers = useMemo(
    () => MARKER_LAYERS.filter(t => selectedLayers[t]),
    [selectedLayers]
  );

  const [visibleMarkers, setVisibleMarkers] = useState(
    isInitiallyZoomedIn ? enabledMarkerLayers : []
  );
  // Bail out if content is unchanged so React.memo on Markers stays effective.
  // setVisibleMarkers(newArr) always creates a new reference even with the same items,
  // which would bypass memo and trigger 3 marker-layer update cycles unnecessarily.
  const setVisibleMarkersStable = useCallback(nextOrUpdater => {
    setVisibleMarkers(prev => {
      const next =
        typeof nextOrUpdater === 'function'
          ? nextOrUpdater(prev)
          : nextOrUpdater;
      if (prev.length === next.length && next.every(v => prev.includes(v)))
        return prev;
      return next;
    });
  }, []);
  const [isMarkersMode, setIsMarkersMode] = useState(isInitiallyZoomedIn);
  const [isMassifPolygonMode, setIsMassifPolygonMode] = useState(
    initialZoom >= MASSIFS_POLYGON_LIMIT
  );
  const zoomState = useRef(
    isInitiallyZoomedIn ? ZOOM_STATE.MARKERS : ZOOM_STATE.CLUSTER
  );
  const prevZoom = useRef(initialZoom);

  const enabledMarkerLayersRef = useRef(enabledMarkerLayers);
  enabledMarkerLayersRef.current = enabledMarkerLayers;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const showMassifPolygons =
    !!selectedLayers[layerTypes.MASSIFS] && isMassifPolygonMode;

  const handleUpdate = useCallback(() => {
    const currentZoom = map.getZoom();
    // Below MARKERS_LIMIT we're in cluster mode: entrances/networks/massifs
    // are drawn from the bulk "all coordinates" fetch done once at page load,
    // and per-tile marker fetches are pure waste. Gating here (using the live
    // `map.getZoom()`, not the batched `visibleMarkers` state) also fixes the
    // transitional burst on big zoom-outs where `zoomend` sets the new state
    // but `moveend` fires with a stale closure and would otherwise request
    // hundreds of marker tiles for the whole world in one moveend.
    const markersToFetch = currentZoom >= MARKERS_LIMIT ? visibleMarkers : [];
    onUpdateRef.current({
      markers: markersToFetch,
      showMassifPolygons,
      zoom: currentZoom,
      center: map.getCenter(),
      bounds: map.getBounds()
    });
  }, [visibleMarkers, showMassifPolygons, map]);

  // Whenever the user toggles layers on/off, resync visibleMarkers so the
  // marker layer picks up (or drops) that type immediately — but only when
  // we're actually in markers mode. In cluster mode, visibleMarkers stays []
  // and the ClusterLayer components pick up the change via their own props.
  useEffect(() => {
    if (zoomState.current === ZOOM_STATE.MARKERS) {
      setVisibleMarkersStable(enabledMarkerLayers);
    }
  }, [enabledMarkerLayers, setVisibleMarkersStable]);

  // zoomend: manages cluster ↔ markers visibility only.
  // It does NOT call handleUpdate directly - moveend fires right after zoomend
  // and handles that, ensuring the correct final position is always used.
  useMapEvent('zoomend', () => {
    const currentZoom = map.getZoom();
    const isZoomingIn = prevZoom.current < currentZoom;

    // --- MARKERS_LIMIT threshold: cluster bubbles ↔ real point markers ---
    if (isZoomingIn && currentZoom >= MARKERS_LIMIT) {
      if (zoomState.current !== ZOOM_STATE.MARKERS) {
        setVisibleMarkersStable(enabledMarkerLayersRef.current);
        setIsMarkersMode(true);
        zoomState.current = ZOOM_STATE.MARKERS;
      }
    } else if (
      !isZoomingIn &&
      currentZoom < MARKERS_LIMIT &&
      zoomState.current === ZOOM_STATE.MARKERS
    ) {
      // Empty visibleMarkers below the threshold — clusters take over, no
      // real marker (entrance/network/organization) should linger.
      zoomState.current = ZOOM_STATE.CLUSTER;
      setIsMarkersMode(false);
      setVisibleMarkersStable([]);
    }

    // --- Massif polygon mode threshold ---
    const prevMassifMode = prevZoom.current >= MASSIFS_POLYGON_LIMIT;
    const currMassifMode = currentZoom >= MASSIFS_POLYGON_LIMIT;
    if (prevMassifMode !== currMassifMode) {
      setIsMassifPolygonMode(currMassifMode);
    }

    prevZoom.current = currentZoom;
  });

  const contextDisplayValue = useMemo(() => {
    if (!contextCoords) return '';
    try {
      return (
        formatCoordinatesForCopy(
          contextCoords.lat,
          contextCoords.lng,
          preferred,
          projections
        ) ?? formatWGS84(contextCoords.lat, contextCoords.lng, 4)
      );
    } catch {
      return formatWGS84(contextCoords.lat, contextCoords.lng, 4);
    }
  }, [contextCoords, preferred, projections]);

  const handleContextCopy = useCallback(async () => {
    if (!contextDisplayValue) return;
    await copyToClipboard(contextDisplayValue);
    if (!isTouch) onSuccess(formatMessage({ id: 'Coordinates copied' }));
    setContextCoords(null);
  }, [contextDisplayValue, isTouch, onSuccess, formatMessage]);

  const handlePreferenceChange = useCallback(
    code => {
      setPref(code);
      setFormatMenuAnchor(null);
    },
    [setPref]
  );

  // useAuthNavigate requires a static URL at hook-call time, but the target URL
  // depends on contextCoords captured at click time. We replicate the same pattern
  // (store pending URL in state, navigate in a useEffect when isAuth becomes true).
  useEffect(() => {
    if (isAuth && pendingEntranceUrl) {
      navigate(pendingEntranceUrl);
      setPendingEntranceUrl(null);
    }
  }, [isAuth, pendingEntranceUrl, navigate]);

  const handleContextMenuClose = useCallback(() => {
    setContextCoords(null);
    setPendingEntranceUrl(null);
  }, []);

  const handleCreateEntrance = useCallback(() => {
    const url = `/ui/entity/add/entrance?lat=${contextCoords.lat}&lng=${contextCoords.lng}`;
    setContextCoords(null);
    if (isAuth) {
      navigate(url);
    } else {
      setPendingEntranceUrl(url);
      dispatch(displayLoginDialog());
    }
  }, [contextCoords, isAuth, navigate, dispatch]);

  const handlePlaceWaypoint = useCallback(() => {
    setWaypoint({ lat: contextCoords.lat, lng: contextCoords.lng });
    setContextCoords(null);
  }, [contextCoords, setWaypoint]);

  // Stable handler: react-leaflet's useMapEvent leaks the previous listener
  // whenever the callback identity changes, so an inline arrow would
  // accumulate one Leaflet listener per render.
  const handleContextMenu = useCallback(e => {
    e.originalEvent.preventDefault();
    setContextCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    setContextMenuAnchor({
      top: e.originalEvent.clientY,
      left: e.originalEvent.clientX
    });
  }, []);
  useMapEvent('contextmenu', handleContextMenu);

  // moveend fires after ALL map movement has finished - including mobile inertia.
  useMapEvent('moveend', handleUpdate);

  useEffect(() => {
    handleUpdate();
  }, [handleUpdate]);

  // Each layer's cluster gives way to real markers (entrances/networks/orgs)
  // at zoom >= MARKERS_LIMIT (13), or to polygons (massifs) at zoom >=
  // MASSIFS_POLYGON_LIMIT (8). Rebuilt every render, but data (entrances,
  // networks, ...) are stable Redux references that only change when new tile
  // data arrives, so useCluster's kD-tree isn't rebuilt on unrelated renders.

  // Offline at detail zoom with nothing drawn: the tiles covering this area
  // were never fetched online, so they aren't in the service worker cache.
  // Checked against the layers actually visible — a hidden layer holding data
  // must not suppress the notice, and a visible one holding data must.
  const hasVisibleMarkers =
    (visibleMarkers.includes(layerTypes.ENTRANCES) &&
      filteredEntranceMarkers.length > 0) ||
    (visibleMarkers.includes(layerTypes.NETWORKS) &&
      networkMarkers.length > 0) ||
    (visibleMarkers.includes(layerTypes.ORGANIZATIONS) &&
      organizationMarkers.length > 0);
  // `visibleMarkers.length > 0` is the guard against blaming the cache for an
  // empty map the user emptied themselves: unticking every marker layer in the
  // LayersControl leaves the same "nothing drawn" state, and telling them to
  // zoom out would be wrong — the data is there, they hid it.
  const showOfflineDetailNotice =
    !isOnline &&
    isMarkersMode &&
    visibleMarkers.length > 0 &&
    !hasVisibleMarkers;

  const clusterConfigs = [
    {
      type: 'entrance',
      layer: layerTypes.ENTRANCES,
      data: entrances,
      off: isMarkersMode
    },
    {
      type: 'network',
      layer: layerTypes.NETWORKS,
      data: networks,
      off: isMarkersMode
    },
    {
      type: 'massif',
      layer: layerTypes.MASSIFS,
      data: massifs,
      off: isMassifPolygonMode
    },
    {
      type: 'organization',
      layer: layerTypes.ORGANIZATIONS,
      data: organizations,
      off: isMarkersMode
    }
  ];

  return (
    <>
      {ClusterGlobalCss}
      <GeocodingControl />
      <MeasureControl />
      <DataControl
        selectedLayers={selectedLayers}
        toggleLayer={toggleLayer}
        entranceFilters={ENTRANCE_MARKER_FILTERS}
        activeEntranceFilters={activeEntranceFilters}
        setActiveEntranceFilters={setActiveEntranceFilters}
        qualityFilters={ENTRANCE_QUALITY_FILTERS}
        activeQualityFilters={activeQualityFilters}
        setActiveQualityFilters={setActiveQualityFilters}
        isMarkersMode={isMarkersMode}
        isAuth={isAuth}
        showExplored={showExplored}
        setShowExplored={setShowExplored}
        hasExploredData={hasExploredData}
        useLeafletControl
      />
      <ExploredOverlay points={showExplored && isAuth ? exploredPoints : []} />
      <OfflineDetailNotice show={showOfflineDetailNotice} />
      {clusterConfigs.map(({ type, layer, data, off }) => (
        <ClusterLayer
          key={type}
          data={data}
          type={type}
          enabled={!!selectedLayers[layer] && !off}
        />
      ))}
      <Markers
        visibleMarkers={visibleMarkers}
        organizations={organizationMarkers}
        networks={networkMarkers}
        entrances={filteredEntranceMarkers}
      />
      <MassifPolygons massifs={showMassifPolygons ? massifPolygons : []} />
      <PopupTargetHandler popupTarget={popupTarget} />
      {/* HydratedMap is always rendered inside CustomMapContainer's
          MapLocationProvider, so WaypointNavigation needs no provider of its
          own — the provider only starts subscribing on the first
          enable()/requestHeading() call, so non-touch users pay nothing. */}
      {isTouch && waypoint && (
        <WaypointNavigation
          waypoint={waypoint}
          onDelete={() => setWaypoint(null)}
        />
      )}
      <Menu
        open={Boolean(contextCoords)}
        onClose={handleContextMenuClose}
        anchorReference="anchorPosition"
        anchorPosition={contextMenuAnchor}
        PaperProps={{ sx: { minWidth: 260 } }}>
        <ListSubheader
          disableSticky
          sx={{ lineHeight: '32px', fontWeight: 'bold' }}>
          {`${formatMessage({ id: 'Point coordinates' })} (${getCRSLabel(preferred, projections)})`}
        </ListSubheader>
        <Box
          sx={{
            pl: 2,
            pr: 0.5,
            display: 'flex',
            alignItems: 'center'
          }}>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {contextDisplayValue}
          </Typography>
          <Tooltip title={formatMessage({ id: 'Copy coordinates' })}>
            <IconButton
              size="small"
              aria-label={formatMessage({ id: 'Copy coordinates' })}
              onClick={handleContextCopy}
              sx={{ color: 'text.secondary' }}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={formatMessage({ id: 'Change coordinate system' })}>
            <IconButton
              size="small"
              aria-label={formatMessage({ id: 'Change coordinate system' })}
              onClick={e => setFormatMenuAnchor(e.currentTarget)}
              sx={{ color: 'text.secondary' }}>
              <Tune fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />
        <MenuItem onClick={handleCreateEntrance}>
          <ListItemIcon>
            <EntityIcon iconType="entrance" size={20} />
          </ListItemIcon>
          <ListItemText>
            {formatMessage({ id: 'Create an entrance here' })}
          </ListItemText>
        </MenuItem>
        {isTouch && (
          <MenuItem onClick={handlePlaceWaypoint}>
            <ListItemIcon>
              <LocationOn fontSize="small" sx={{ color: WAYPOINT_COLOR }} />
            </ListItemIcon>
            <ListItemText>
              {formatMessage({
                id: waypoint ? 'Move waypoint here' : 'Place a waypoint here'
              })}
            </ListItemText>
          </MenuItem>
        )}
      </Menu>
      <CRSMenu
        anchorEl={formatMenuAnchor}
        onClose={() => setFormatMenuAnchor(null)}
        preferred={preferred}
        projections={projections}
        onSelect={handlePreferenceChange}
      />
    </>
  );
};

// Bump MAP_TOUR_VERSION whenever tour content changes significantly enough to re-show to all users.
// This invalidates every user's stored preference automatically (old key is simply never read).
const MAP_TOUR_VERSION = 1;
const MAP_TOUR_SEEN_KEY = `mapTourSeen_v${MAP_TOUR_VERSION}`;
const MAP_TOUR_SESSION_KEY = `mapTourSeenThisSession_v${MAP_TOUR_VERSION}`;
// Set VITE_DISABLE_MAP_TOUR=true in .env.local to prevent the tour from launching in dev.
const MAP_TOUR_DISABLED = import.meta.env.VITE_DISABLE_MAP_TOUR === 'true';

const Index = ({
  center,
  zoom,
  isSideMenuOpen,
  mapRef,
  popupTarget = null,
  ...props
}) => {
  const [runTour, setRunTour] = useState(
    () =>
      !MAP_TOUR_DISABLED &&
      localStorage.getItem(MAP_TOUR_SEEN_KEY) !== 'true' &&
      sessionStorage.getItem(MAP_TOUR_SESSION_KEY) !== 'true'
  );

  const handleTourEnd = useCallback(dontShowAgain => {
    sessionStorage.setItem(MAP_TOUR_SESSION_KEY, 'true');
    if (dontShowAgain) localStorage.setItem(MAP_TOUR_SEEN_KEY, 'true');
    setRunTour(false);
  }, []);

  // Shared canvas renderer for the global map: widened clip area (padding 0.5
  // vs Leaflet's default 0.1) means small pans stay within the canvas and only
  // cost a CSS transform — no re-project of thousands of entrance points. All
  // vector layers on this map (entrances, massif polygons) share this single
  // canvas, so hit-testing is coordinated and no canvas blocks clicks meant
  // for another. A fresh instance per mount avoids stale state on remount.
  // Empty dep array is intentional: this renderer must be created exactly once
  // per component lifetime, not a missing-dependency oversight.
  const renderer = useMemo(() => L.canvas({ padding: 0.5 }), []);

  return (
    <>
      <CustomMapContainer
        center={center}
        zoom={zoom}
        isFullscreenAllowed={false}
        isSideMenuOpen={isSideMenuOpen}
        isLocationControlAlways
        mapRef={mapRef}
        renderer={renderer}>
        <HydratedMap {...props} popupTarget={popupTarget} />
      </CustomMapContainer>
      <MapTour run={runTour} onEnd={handleTourEnd} />
    </>
  );
};

const markerType = PropTypes.shape({
  latitude: PropTypes.number.isRequired,
  longitude: PropTypes.number.isRequired,
  id: PropTypes.number.isRequired,
  name: PropTypes.string
});

HydratedMap.propTypes = {
  entrances: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  entranceMarkers: PropTypes.arrayOf(markerType),
  networks: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  networkMarkers: PropTypes.arrayOf(markerType),
  organizations: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  organizationMarkers: PropTypes.arrayOf(markerType),
  massifs: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  massifPolygons: PropTypes.arrayOf(massifPolygonType),
  onUpdate: PropTypes.func.isRequired
};

Index.propTypes = {
  isSideMenuOpen: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  mapRef: PropTypes.shape({ current: PropTypes.shape({}) }),
  ...HydratedMap.propTypes
};

export default Index;
