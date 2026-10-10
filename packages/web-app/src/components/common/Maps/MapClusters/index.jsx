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
  LinearProgress,
  useMediaQuery
} from '@mui/material';
import { ContentCopy, LocationOn, Tune } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import copyToClipboard from '@/utils/clipboard';
import { matchesEntranceMarker } from '@/utils/entranceMapFilters';
import useEntranceClusters from '@/hooks/useEntranceClusters';
import useEntranceFilters from '@/hooks/useEntranceFilters';
import GeocodingControl from '../common/GeocodingControl';
import MapTour from './MapTour';
import DataDisplayControl, { layerTypes } from './DataDisplayControl';
import FiltersControl from './FiltersControl';
import {
  formatCoordinatesForCopy,
  formatWGS84
} from '../../../../helpers/coordinateConvert';
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
import OfflineDisabled from '../../OfflineDisabled';
import CRSMenu from '../../CRSMenu';
import MeasureControl from '../common/MeasureControl';
import ClusterLayer, { ClusterGlobalCss } from './ClusterLayer';
import Markers from './Markers';
import MassifPolygons, { massifPolygonType } from './MassifPolygons';
import ExploredOverlay from './ExploredOverlay';
import OfflineDetailNotice, {
  shouldShowOfflineDetailNotice
} from './OfflineDetailNotice';
import useExploredEntrances from './useExploredEntrances';
import PopupTargetHandler from './PopupTargetHandler';
import WaypointNavigation from '../common/Waypoint/WaypointNavigation';
import { WAYPOINT_COLOR } from '../common/Waypoint/waypointIcon';
import CustomMapContainer from '../common/MapContainer';
import { MARKERS_LIMIT, MASSIFS_POLYGON_LIMIT } from './constants';

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
const EMPTY_MARKER_LAYERS = [];

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
  const { onSuccess, onError } = useNotification();
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

  const [zoom, setZoom] = useState(() => map.getZoom());
  const isMarkersMode = zoom >= MARKERS_LIMIT;

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
  const {
    filters: entranceFilters,
    toggleSize,
    toggleQuality,
    setMinInterest,
    hasActiveFilters,
    resetFilters
  } = useEntranceFilters();
  const entranceClusters = useEntranceClusters(entrances, entranceFilters);

  useEffect(() => {
    if (entranceClusters.error) {
      onError(formatMessage({ id: 'unexpected error' }));
    }
  }, [entranceClusters.error, onError, formatMessage]);

  const filteredEntranceMarkers = useMemo(
    () =>
      entranceMarkers.filter(e => matchesEntranceMarker(e, entranceFilters)),
    [entranceMarkers, entranceFilters]
  );

  let filterDisabledReasonKey = null;
  // Legacy cache compatibility: pairs have no filtering criteria. Only this
  // transitional dataset makes filter availability depend on display mode;
  // detailed markers still have criteria, and enriched tuples work at any zoom.
  if (!isMarkersMode && entranceClusters.hasCriteria === false) {
    filterDisabledReasonKey = 'mapFiltersRequireUpdatedCoordinates';
  } else if (!selectedLayers[layerTypes.ENTRANCES]) {
    filterDisabledReasonKey = hasActiveFilters
      ? 'Turn on entrances to apply saved filters'
      : 'Turn on entrances to enable filters';
  }

  // Marker-eligible layers currently selected — the set to fetch and render as
  // real markers whenever we're above MARKERS_LIMIT. Massifs never appear here
  // (they become polygons instead).
  const enabledMarkerLayers = useMemo(
    () => MARKER_LAYERS.filter(t => selectedLayers[t]),
    [selectedLayers]
  );

  // Derived values stay stable on pan and on zooms within the same mode.
  const visibleMarkers = isMarkersMode
    ? enabledMarkerLayers
    : EMPTY_MARKER_LAYERS;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const isMassifsLayerOn = !!selectedLayers[layerTypes.MASSIFS];
  const showMassifPolygons = isMassifsLayerOn && zoom >= MASSIFS_POLYGON_LIMIT;

  const handleUpdate = useCallback(() => {
    const currentZoom = map.getZoom();
    // Read Leaflet's live zoom: React may not have rendered the zoomend update
    // when moveend fires. Never fetch detail tiles for a low-zoom viewport.
    const markersToFetch =
      currentZoom >= MARKERS_LIMIT ? enabledMarkerLayers : EMPTY_MARKER_LAYERS;
    onUpdateRef.current({
      markers: markersToFetch,
      showMassifPolygons:
        isMassifsLayerOn && currentZoom >= MASSIFS_POLYGON_LIMIT,
      zoom: currentZoom,
      center: map.getCenter(),
      bounds: map.getBounds()
    });
  }, [enabledMarkerLayers, isMassifsLayerOn, map]);

  const handleZoomEnd = useCallback(() => setZoom(map.getZoom()), [map]);
  useMapEvent('zoomend', handleZoomEnd);

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
  // The decision itself sits next to the notice it drives, as a pure predicate,
  // so the "user unticked every layer" case is covered by a test instead of
  // resting on a manual pass over a Leaflet map.
  const showOfflineDetailNotice = shouldShowOfflineDetailNotice({
    isOnline,
    isMarkersMode,
    visibleMarkers,
    markerCounts: {
      // Count cached data before filtering: an empty selection is available
      // offline data, not a missing tile.
      [layerTypes.ENTRANCES]: entranceMarkers.length,
      [layerTypes.NETWORKS]: networkMarkers.length,
      [layerTypes.ORGANIZATIONS]: organizationMarkers.length
    }
  });

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
      off: zoom >= MASSIFS_POLYGON_LIMIT
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
      <DataDisplayControl
        selectedLayers={selectedLayers}
        toggleLayer={toggleLayer}
        isAuth={isAuth}
        showExplored={showExplored}
        setShowExplored={setShowExplored}
        hasExploredData={hasExploredData}
        useLeafletControl
      />
      <FiltersControl
        filters={entranceFilters}
        onSizeChange={toggleSize}
        onQualityChange={toggleQuality}
        onInterestChange={setMinInterest}
        disabledReasonKey={filterDisabledReasonKey}
        hasActiveFilters={hasActiveFilters}
        resetFilters={resetFilters}
        useLeafletControl
      />
      <ExploredOverlay points={showExplored && isAuth ? exploredPoints : []} />
      <OfflineDetailNotice show={showOfflineDetailNotice} />
      {clusterConfigs.map(({ type, layer, data, off }) => (
        <ClusterLayer
          key={type}
          data={data}
          type={type}
          clusterSource={
            type === 'entrance' ? entranceClusters.source : undefined
          }
          enabled={!!selectedLayers[layer] && !off}
        />
      ))}
      {selectedLayers[layerTypes.ENTRANCES] &&
        !isMarkersMode &&
        entranceClusters.isPending && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 500
            }}>
            <LinearProgress aria-label={formatMessage({ id: 'Loading ...' })} />
          </Box>
        )}
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
        slotProps={{ paper: { sx: { minWidth: 260 } } }}>
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
        {/* The creation form ends in a POST, so this is a dead end offline —
            same "block at the door" rule as the Contribute button in the side
            menu. fullWidth so the wrapper doesn't shrink the item inside the
            menu. */}
        <OfflineDisabled fullWidth>
          <MenuItem onClick={handleCreateEntrance} disabled={!isOnline}>
            <ListItemIcon>
              <EntityIcon iconType="entrance" size={20} />
            </ListItemIcon>
            <ListItemText>
              {formatMessage({ id: 'Create an entrance here' })}
            </ListItemText>
          </MenuItem>
        </OfflineDisabled>
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
const MAP_TOUR_VERSION = 2;
const MAP_TOUR_SEEN_KEY = `mapTourSeen_v${MAP_TOUR_VERSION}`;
const MAP_TOUR_SESSION_KEY = `mapTourSeenThisSession_v${MAP_TOUR_VERSION}`;
// Set VITE_DISABLE_MAP_TOUR=true in .env.local to prevent the tour from launching in dev.
const MAP_TOUR_DISABLED = import.meta.env.VITE_DISABLE_MAP_TOUR === 'true';

const Index = ({ center, zoom, mapRef, popupTarget = null, ...props }) => {
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
  name: PropTypes.string,
  aestheticism: PropTypes.number
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
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  mapRef: PropTypes.shape({ current: PropTypes.shape({}) }),
  ...HydratedMap.propTypes
};

export default Index;
