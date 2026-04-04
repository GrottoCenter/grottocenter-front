import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import { uniq } from 'ramda';

import DataControl, { heatmapTypes, markerTypes } from './DataControl';
import MapTour from './MapTour';
import ConverterControl from '../common/Converter';
import GeocodingControl from '../common/GeocodingControl';
import MeasureControl from '../common/MeasureControl';
import useHeatLayer, { HexGlobalCss } from './useHeatLayer';
import Markers from './Markers';
import MassifPolygons, { massifPolygonType } from './MassifPolygons';
import CustomMapContainer from '../common/MapContainer';
import {
  MARKERS_LIMIT,
  MASSIFS_POLYGON_LIMIT,
  ENTRANCE_MARKER_FILTERS,
  getCaveSize,
  CAVE_SIZE
} from './constants';

const ZOOM_STATE = {
  MARKERS: 1,
  HEAT: 2
};

const HydratedMap = ({
  entrances,
  entranceMarkers = [],
  networks,
  networkMarkers = [],
  organizations,
  massifs,
  massifPolygons = [],
  projectionsList,
  onUpdate
}) => {
  const map = useMap();
  const { updateLayers } = useHeatLayer();

  const initialZoom = useRef(map.getZoom()).current;
  const isInitiallyZoomedIn = initialZoom >= MARKERS_LIMIT;

  const [selectedHeats, setSelectedHeats] = useState(
    () => new Set([heatmapTypes.ENTRANCES])
  );
  const [selectedMarkers, setSelectedMarkers] = useState(
    Object.fromEntries(Object.values(markerTypes).map(type => [type, false]))
  );
  const [activeEntranceFilters, setActiveEntranceFilters] = useState(
    Object.fromEntries(Object.values(CAVE_SIZE).map(size => [size, true]))
  );
  const filteredEntranceMarkers = useMemo(
    () => entranceMarkers.filter(e => activeEntranceFilters[getCaveSize(e)]),
    [entranceMarkers, activeEntranceFilters]
  );

  const selectedMarkersList = useMemo(
    () =>
      Object.entries(selectedMarkers)
        .filter(([, v]) => v)
        .map(([k]) => k),
    [selectedMarkers]
  );

  const [visibleMarkers, setVisibleMarkers] = useState(
    isInitiallyZoomedIn
      ? uniq([heatmapTypes.ENTRANCES, ...Object.keys(selectedMarkers).filter(k => selectedMarkers[k])])
      : []
  );
  // Bail out if content is unchanged so React.memo on Markers stays effective.
  // setVisibleMarkers(newArr) always creates a new reference even with the same items,
  // which would bypass memo and trigger 3 marker-layer update cycles unnecessarily.
  const setVisibleMarkersStable = useCallback(nextOrUpdater => {
    setVisibleMarkers(prev => {
      const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(prev) : nextOrUpdater;
      if (prev.length === next.length && next.every(v => prev.includes(v))) return prev;
      return next;
    });
  }, []);
  const [isMarkersMode, setIsMarkersMode] = useState(isInitiallyZoomedIn);
  const [isMassifPolygonMode, setIsMassifPolygonMode] = useState(
    initialZoom >= MASSIFS_POLYGON_LIMIT
  );
  const zoomState = useRef(isInitiallyZoomedIn ? ZOOM_STATE.MARKERS : ZOOM_STATE.HEAT);
  const prevZoom = useRef(initialZoom);

  const selectedHeatsRef = useRef(selectedHeats);
  selectedHeatsRef.current = selectedHeats;
  const selectedMarkersListRef = useRef(selectedMarkersList);
  selectedMarkersListRef.current = selectedMarkersList;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const showMassifPolygons = selectedHeats.has(heatmapTypes.MASSIFS) && isMassifPolygonMode;

  const handleUpdate = useCallback(() => {
    onUpdateRef.current({
      markers: visibleMarkers,
      showMassifPolygons,
      zoom: map.getZoom(),
      center: map.getCenter(),
      bounds: map.getBounds()
    });
  }, [visibleMarkers, showMassifPolygons, map]);

  useEffect(() => {
    if (zoomState.current === ZOOM_STATE.MARKERS) {
      setVisibleMarkersStable(
        uniq([...Array.from(selectedHeatsRef.current), ...selectedMarkersList])
      );
    } else {
      setVisibleMarkersStable(selectedMarkersList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkers]);

  const handleUpdateHeat = useCallback(
    (type, isChecked) => {
      setSelectedHeats(prev => {
        const next = new Set(prev);
        if (isChecked) next.add(type);
        else next.delete(type);
        return next;
      });
      if (zoomState.current === ZOOM_STATE.MARKERS) {
        setVisibleMarkersStable(prev =>
          isChecked ? uniq([...prev, type]) : prev.filter(t => t !== type)
        );
      }
    },
    [setVisibleMarkersStable]
  );

  // zoomend: manages heatmap ↔ markers visibility only.
  // It does NOT call handleUpdate directly - moveend fires right after zoomend
  // and handles that, ensuring the correct final position is always used.
  useMapEvent('zoomend', () => {
    const currentZoom = map.getZoom();
    const isZoomingIn = prevZoom.current < currentZoom;

    // --- MARKERS_LIMIT threshold: heatmap ↔ point markers ---
    if (isZoomingIn && currentZoom >= MARKERS_LIMIT) {
      if (zoomState.current !== ZOOM_STATE.MARKERS) {
        setVisibleMarkersStable(
          uniq([...Array.from(selectedHeatsRef.current), ...selectedMarkersListRef.current])
        );
        setIsMarkersMode(true);
        zoomState.current = ZOOM_STATE.MARKERS;
      }
    } else if (
      !isZoomingIn &&
      currentZoom < MARKERS_LIMIT &&
      zoomState.current === ZOOM_STATE.MARKERS
    ) {
      zoomState.current = ZOOM_STATE.HEAT;
      setIsMarkersMode(false);
      setVisibleMarkersStable(selectedMarkersListRef.current);
    }

    // --- Massif polygon mode threshold ---
    const prevMassifMode = prevZoom.current >= MASSIFS_POLYGON_LIMIT;
    const currMassifMode = currentZoom >= MASSIFS_POLYGON_LIMIT;
    if (prevMassifMode !== currMassifMode) {
      setIsMassifPolygonMode(currMassifMode);
    }

    prevZoom.current = currentZoom;
  });

  // moveend fires after ALL map movement has finished - including mobile inertia.
  useMapEvent('moveend', handleUpdate);

  useEffect(() => {
    handleUpdate();
  }, [handleUpdate]);

  // Feed the three layers whenever selection, data, or zoom mode changes.
  // isMarkersMode/isMassifPolygonMode are included so zooming back out re-triggers this
  // and re-populates the hex layers.
  useEffect(() => {
    const activeTypes = Array.from(selectedHeats).filter(t => {
      if (t === heatmapTypes.MASSIFS) return !isMassifPolygonMode;
      return !isMarkersMode;
    });

    updateLayers(
      {
        [heatmapTypes.ENTRANCES]: entrances,
        [heatmapTypes.NETWORKS]: networks,
        [heatmapTypes.MASSIFS]: massifs
      },
      activeTypes
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHeats, entrances, networks, massifs, isMarkersMode, isMassifPolygonMode]);

  return (
    <>
      {HexGlobalCss}
      <GeocodingControl />
      <MeasureControl />
      <DataControl
        updateHeatmap={handleUpdateHeat}
        selectedHeats={selectedHeats}
        selectedMarkers={selectedMarkers}
        setSelectedMarkers={setSelectedMarkers}
        entranceFilters={ENTRANCE_MARKER_FILTERS}
        activeEntranceFilters={activeEntranceFilters}
        setActiveEntranceFilters={setActiveEntranceFilters}
        isMarkersMode={isMarkersMode}
        useLeafletControl
      />
      <ConverterControl projectionsList={projectionsList} />
      <Markers
        visibleMarkers={visibleMarkers}
        organizations={organizations}
        networks={networkMarkers}
        entrances={filteredEntranceMarkers}
      />
      <MassifPolygons massifs={showMassifPolygons ? massifPolygons : []} />
    </>
  );
};

// Bump MAP_TOUR_VERSION whenever tour content changes significantly enough to re-show to all users.
// This invalidates every user's stored preference automatically (old key is simply never read).
const MAP_TOUR_VERSION = 1;
const MAP_TOUR_SEEN_KEY = `mapTourSeen_v${MAP_TOUR_VERSION}`;
const MAP_TOUR_SESSION_KEY = `mapTourSeenThisSession_v${MAP_TOUR_VERSION}`;
// Set REACT_APP_DISABLE_MAP_TOUR=true in .env.local to prevent the tour from launching in dev.
const MAP_TOUR_DISABLED = process.env.REACT_APP_DISABLE_MAP_TOUR === 'true';

const Index = ({ center, zoom, isSideMenuOpen, mapRef, ...props }) => {
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

  return (
    <>
      <CustomMapContainer
        center={center}
        zoom={zoom}
        isFullscreenAllowed={false}
        isSideMenuOpen={isSideMenuOpen}
        isLocateControl
        mapRef={mapRef}>
        <HydratedMap {...props} />
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
  organizations: PropTypes.arrayOf(markerType),
  massifs: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  massifPolygons: PropTypes.arrayOf(massifPolygonType),
  projectionsList: PropTypes.arrayOf(PropTypes.shape({})),
  onUpdate: PropTypes.func
};

Index.propTypes = {
  isSideMenuOpen: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  mapRef: PropTypes.shape({ current: PropTypes.any }),
  ...HydratedMap.propTypes
};

export default Index;
