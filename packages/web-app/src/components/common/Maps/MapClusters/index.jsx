import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import { without, pipe, append, uniq } from 'ramda';

import DataControl, { heatmapTypes, markerTypes } from './DataControl';
import ConverterControl from '../common/Converter';
import GeocodingControl from '../common/GeocodingControl';
import MeasureControl from '../common/MeasureControl';
import useHeatLayer, { HexGlobalCss } from './useHeatLayer';
import Markers from './Markers';
import MassifPolygons from './MassifPolygons';
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
  const { updateHeatData } = useHeatLayer(entrances);
  const [selectedHeat, setSelectedHeat] = useState(heatmapTypes.ENTRANCES);
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
  const map = useMap();
  const initialZoom = useRef(map.getZoom()).current;
  const isInitiallyZoomedIn = initialZoom >= MARKERS_LIMIT;
  const [visibleHeat, setVisibleHeat] = useState(isInitiallyZoomedIn ? heatmapTypes.NONE : selectedHeat);
  const [visibleMarkers, setVisibleMarkers] = useState(isInitiallyZoomedIn ? [selectedHeat] : []);
  const [isMarkersMode, setIsMarkersMode] = useState(isInitiallyZoomedIn);
  const [isMassifsAboveThreshold, setIsMassifsAboveThreshold] = useState(
    initialZoom >= MASSIFS_POLYGON_LIMIT
  );
  const zoomState = useRef(isInitiallyZoomedIn ? ZOOM_STATE.MARKERS : ZOOM_STATE.HEAT);
  const prevZoom = useRef(initialZoom);
  // Refs to avoid stale closures in event handlers (zoomend, handleUpdateHeat)
  const selectedHeatRef = useRef(selectedHeat);
  selectedHeatRef.current = selectedHeat;
  const selectedMarkersListRef = useRef(selectedMarkersList);
  selectedMarkersListRef.current = selectedMarkersList;

  // Keep onUpdate ref-stable so handleUpdate's useCallback doesn't depend on it
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  // Whether massif polygons should currently be fetched and displayed
  const showMassifPolygons =
    selectedHeat === heatmapTypes.MASSIFS && isMassifsAboveThreshold;

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
      setVisibleMarkers(
        pipe(append(selectedHeat), uniq, without(['none']))(selectedMarkersList)
      );
    } else {
      setVisibleMarkers(selectedMarkersList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkers]);

  const handleUpdateHeat = useCallback(newHeat => {
    setSelectedHeat(newHeat);
    if (zoomState.current === ZOOM_STATE.HEAT) {
      setVisibleHeat(newHeat);
    } else {
      setVisibleMarkers(
        pipe(
          append(newHeat),
          uniq,
          without(['none'])
        )(selectedMarkersListRef.current)
      );
    }
  }, []);

  // zoomend: manages heatmap ↔ markers visibility only.
  // It does NOT call handleUpdate directly - moveend fires right after zoomend
  // and handles that, ensuring the correct final position is always used.
  useMapEvent('zoomend', () => {
    const currentZoom = map.getZoom();
    const isZoomingIn = prevZoom.current < currentZoom;

    // Update massifs polygon threshold state
    setIsMassifsAboveThreshold(currentZoom >= MASSIFS_POLYGON_LIMIT);

    // When close enough we want to display disable heatmap ans show markers
    if (isZoomingIn && currentZoom >= MARKERS_LIMIT) {
      // do not update visible markers if it's already displayed
      if (zoomState.current !== ZOOM_STATE.MARKERS) {
        setVisibleMarkers(
          pipe(
            append(selectedHeatRef.current),
            uniq,
            without(['none'])
          )(selectedMarkersListRef.current)
        );
        setVisibleHeat('none');
        setIsMarkersMode(true);
        zoomState.current = ZOOM_STATE.MARKERS;
      }
    } else if (!isZoomingIn && currentZoom < MARKERS_LIMIT) {
      // When too far we want to switch back to the heatmap
      setVisibleHeat(selectedHeatRef.current);
      setVisibleMarkers(selectedMarkersListRef.current);
      setIsMarkersMode(false);
      zoomState.current = ZOOM_STATE.HEAT;
    }
    prevZoom.current = currentZoom;
  });

  // moveend fires after ALL map movement has finished - including mobile inertia.
  // Using moveend instead of dragend ensures map.getBounds() returns the final
  // resting position, not a mid-inertia snapshot. It also covers zoom events
  // since Leaflet fires moveend after zoomend.
  useMapEvent('moveend', handleUpdate);

  // Called when visibility changes (zoom threshold crossing or DataControl change).
  // handleUpdate is stable as long as visibleMarkers/showMassifPolygons don't change,
  // so this effect only re-runs when the data to fetch actually changes.
  useEffect(() => {
    handleUpdate();
  }, [handleUpdate]);

  // Update visible heat layer
  useEffect(() => {
    switch (visibleHeat) {
      case heatmapTypes.ENTRANCES:
        updateHeatData(entrances, heatmapTypes.ENTRANCES);
        break;
      case heatmapTypes.NETWORKS:
        updateHeatData(networks, heatmapTypes.NETWORKS);
        break;
      case heatmapTypes.MASSIFS:
        updateHeatData(massifs, heatmapTypes.MASSIFS);
        break;
      default:
        updateHeatData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleHeat, networks, entrances, massifs]);

  return (
    <>
      {HexGlobalCss}
      <GeocodingControl />
      <MeasureControl />
      <DataControl
        updateHeatmap={handleUpdateHeat}
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

const Index = ({ center, zoom, isSideMenuOpen, mapRef, ...props }) => (
  <CustomMapContainer
    center={center}
    zoom={zoom}
    isFullscreenAllowed={false}
    isSideMenuOpen={isSideMenuOpen}
    isLocateControl
    mapRef={mapRef}>
    <HydratedMap {...props} />
  </CustomMapContainer>
);

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
  massifPolygons: PropTypes.arrayOf(PropTypes.shape({})),
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
