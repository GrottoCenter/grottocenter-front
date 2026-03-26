import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import { without, pipe, append, uniq } from 'ramda';

import DataControl, { heatmapTypes, markerTypes } from './DataControl';
import ConverterControl from '../common/Converter';
import GeocodingControl from '../common/GeocodingControl';
import MeasureControl from '../common/MeasureControl';
import useMultiHeatLayers from './useMultiHeatLayers';
import { HexGlobalCss } from './useHeatLayer';
import Markers from './Markers';
import MassifPolygons, { massifPolygonType } from './MassifPolygons';
import CustomMapContainer from '../common/MapContainer';
import {
  MARKERS_LIMIT,
  ENTRANCE_MARKER_FILTERS,
  getCaveSize,
  CAVE_SIZE,
  MASSIFS_POLYGON_LIMIT
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
  massifPolygons: massifPolygonsProp = [],
  projectionsList,
  onUpdate
}) => {
  // Which heatmap layers are checked (checkboxes)
  const [activeHeatLayers, setActiveHeatLayers] = useState({
    [heatmapTypes.ENTRANCES]: true,
    [heatmapTypes.NETWORKS]: false,
    [heatmapTypes.MASSIFS]: false
  });

  const activeHeatTypes = useMemo(
    () => Object.entries(activeHeatLayers).filter(([, v]) => v).map(([k]) => k),
    [activeHeatLayers]
  );

  // Determine the lowest heatOffZoom among active types
  const effectiveHeatOffZoom = useMemo(() => {
    if (activeHeatTypes.includes(heatmapTypes.MASSIFS)) return MASSIFS_POLYGON_LIMIT;
    return MARKERS_LIMIT;
  }, [activeHeatTypes]);

  const { updateLayers } = useMultiHeatLayers(effectiveHeatOffZoom);

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
  const [visibleMarkers, setVisibleMarkers] = useState(
    isInitiallyZoomedIn ? [...activeHeatTypes] : []
  );
  const [isMarkersMode, setIsMarkersMode] = useState(isInitiallyZoomedIn);
  const [isHeatVisible, setIsHeatVisible] = useState(!isInitiallyZoomedIn);
  const zoomState = useRef(isInitiallyZoomedIn ? ZOOM_STATE.MARKERS : ZOOM_STATE.HEAT);
  const prevZoom = useRef(initialZoom);

  const activeHeatTypesRef = useRef(activeHeatTypes);
  activeHeatTypesRef.current = activeHeatTypes;
  const selectedMarkersListRef = useRef(selectedMarkersList);
  selectedMarkersListRef.current = selectedMarkersList;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const showMassifPolygons =
    activeHeatLayers[heatmapTypes.MASSIFS] && !isHeatVisible;

  const handleUpdate = useCallback(() => {
    onUpdateRef.current({
      markers: visibleMarkers,
      showMassifPolygons,
      zoom: map.getZoom(),
      center: map.getCenter(),
      bounds: map.getBounds()
    });
  }, [visibleMarkers, showMassifPolygons, map]);

  // When checkbox selection changes in MARKERS mode, update visible markers
  useEffect(() => {
    if (zoomState.current === ZOOM_STATE.MARKERS) {
      setVisibleMarkers(
        pipe(
          () => [...activeHeatTypesRef.current, ...selectedMarkersList],
          uniq,
          without(['none'])
        )()
      );
    } else {
      setVisibleMarkers(selectedMarkersList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkers, activeHeatLayers]);

  // zoomend: manages heatmap ↔ markers visibility
  useMapEvent('zoomend', () => {
    const currentZoom = map.getZoom();
    const isZoomingIn = prevZoom.current < currentZoom;

    if (isZoomingIn && currentZoom >= MARKERS_LIMIT) {
      if (zoomState.current !== ZOOM_STATE.MARKERS) {
        setVisibleMarkers(
          pipe(
            () => [...activeHeatTypesRef.current, ...selectedMarkersListRef.current],
            uniq,
            without(['none'])
          )()
        );
        setIsHeatVisible(false);
        setIsMarkersMode(true);
        zoomState.current = ZOOM_STATE.MARKERS;
      }
    } else if (!isZoomingIn && currentZoom < MARKERS_LIMIT && zoomState.current === ZOOM_STATE.MARKERS) {
      zoomState.current = ZOOM_STATE.HEAT;
      setIsMarkersMode(false);
      setVisibleMarkers(selectedMarkersListRef.current);
      setIsHeatVisible(true);
    }

    prevZoom.current = currentZoom;
  });

  useMapEvent('moveend', handleUpdate);

  useEffect(() => {
    handleUpdate();
  }, [handleUpdate]);

  // Feed data to the multi-layer hook
  useEffect(() => {
    const dataByType = {
      [heatmapTypes.ENTRANCES]: entrances,
      [heatmapTypes.NETWORKS]: networks,
      [heatmapTypes.MASSIFS]: massifs
    };
    if (isHeatVisible) {
      updateLayers(dataByType, activeHeatTypes);
    } else {
      updateLayers(dataByType, []);
    }
  }, [isHeatVisible, activeHeatTypes, entrances, networks, massifs, updateLayers]);

  return (
    <>
      {HexGlobalCss}
      <GeocodingControl />
      <MeasureControl />
      <DataControl
        activeHeatLayers={activeHeatLayers}
        setActiveHeatLayers={setActiveHeatLayers}
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
      <MassifPolygons massifs={showMassifPolygons ? massifPolygonsProp : []} />
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
