import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import { without, pipe, uniq } from 'ramda';

import DataControl, { heatmapTypes, markerTypes } from './DataControl';
import ConverterControl from '../common/Converter';
import GeocodingControl from '../common/GeocodingControl';
import MeasureControl from '../common/MeasureControl';
import useHeatLayer, { HexGlobalCss } from './useHeatLayer';
import useSecondaryDots from './useSecondaryDots';
import Markers from './Markers';
import MassifPolygons, { massifPolygonType } from './MassifPolygons';
import CustomMapContainer from '../common/MapContainer';
import {
  MARKERS_LIMIT,
  ENTRANCE_MARKER_FILTERS,
  getCaveSize,
  CAVE_SIZE,
  getHeatOffZoom
} from './constants';

const ZOOM_STATE = {
  MARKERS: 1,
  HEAT: 2
};

// Priority order: first checked type becomes the primary hexbin layer
const TYPE_PRIORITY = [
  heatmapTypes.ENTRANCES,
  heatmapTypes.NETWORKS,
  heatmapTypes.MASSIFS
];

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
  const [activeHeatLayers, setActiveHeatLayers] = useState({
    [heatmapTypes.ENTRANCES]: true,
    [heatmapTypes.NETWORKS]: false,
    [heatmapTypes.MASSIFS]: false
  });

  const activeHeatTypes = useMemo(
    () => Object.entries(activeHeatLayers).filter(([, v]) => v).map(([k]) => k),
    [activeHeatLayers]
  );

  // First active type by priority becomes the primary hexbin layer
  const primaryType = useMemo(
    () => TYPE_PRIORITY.find(t => activeHeatLayers[t]) || heatmapTypes.NONE,
    [activeHeatLayers]
  );

  // Remaining active types are rendered as dots
  const secondaryTypes = useMemo(
    () => activeHeatTypes.filter(t => t !== primaryType),
    [activeHeatTypes, primaryType]
  );

  const { updateHeatData } = useHeatLayer(
    entrances,
    heatmapTypes.ENTRANCES,
    getHeatOffZoom(primaryType)
  );
  const { updateDots } = useSecondaryDots();

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
  const [visibleHeat, setVisibleHeat] = useState(
    isInitiallyZoomedIn ? heatmapTypes.NONE : primaryType
  );
  const [visibleMarkers, setVisibleMarkers] = useState(
    isInitiallyZoomedIn ? [...activeHeatTypes] : []
  );
  const [isMarkersMode, setIsMarkersMode] = useState(isInitiallyZoomedIn);
  const zoomState = useRef(isInitiallyZoomedIn ? ZOOM_STATE.MARKERS : ZOOM_STATE.HEAT);
  const prevZoom = useRef(initialZoom);

  const primaryTypeRef = useRef(primaryType);
  primaryTypeRef.current = primaryType;
  const activeHeatTypesRef = useRef(activeHeatTypes);
  activeHeatTypesRef.current = activeHeatTypes;
  const selectedMarkersListRef = useRef(selectedMarkersList);
  selectedMarkersListRef.current = selectedMarkersList;

  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const showMassifPolygons =
    activeHeatLayers[heatmapTypes.MASSIFS] && visibleHeat === heatmapTypes.NONE;

  const handleUpdate = useCallback(() => {
    onUpdateRef.current({
      markers: visibleMarkers,
      showMassifPolygons,
      zoom: map.getZoom(),
      center: map.getCenter(),
      bounds: map.getBounds()
    });
  }, [visibleMarkers, showMassifPolygons, map]);

  // When checkbox selection changes
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

  // When primary type changes, update the hexbin layer
  const handleUpdateHeat = useCallback(
    newPrimary => {
      if (zoomState.current === ZOOM_STATE.HEAT) {
        setVisibleHeat(
          map.getZoom() >= getHeatOffZoom(newPrimary)
            ? heatmapTypes.NONE
            : newPrimary
        );
      } else {
        setVisibleMarkers(
          pipe(
            () => [...activeHeatTypesRef.current, ...selectedMarkersListRef.current],
            uniq,
            without(['none'])
          )()
        );
      }
    },
    [map]
  );

  // React to primary type changes
  useEffect(() => {
    handleUpdateHeat(primaryType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryType]);

  useMapEvent('zoomend', () => {
    const currentZoom = map.getZoom();
    const isZoomingIn = prevZoom.current < currentZoom;
    const currentPrimary = primaryTypeRef.current;

    if (isZoomingIn && currentZoom >= MARKERS_LIMIT) {
      if (zoomState.current !== ZOOM_STATE.MARKERS) {
        setVisibleMarkers(
          pipe(
            () => [...activeHeatTypesRef.current, ...selectedMarkersListRef.current],
            uniq,
            without(['none'])
          )()
        );
        setVisibleHeat(heatmapTypes.NONE);
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
      setVisibleMarkers(selectedMarkersListRef.current);
      setVisibleHeat(
        currentZoom >= getHeatOffZoom(currentPrimary)
          ? heatmapTypes.NONE
          : currentPrimary
      );
    }

    // Massif polygon threshold
    if (zoomState.current === ZOOM_STATE.HEAT) {
      const heatOffZoom = getHeatOffZoom(currentPrimary);
      if (heatOffZoom !== MARKERS_LIMIT) {
        const wasPrevAbove = prevZoom.current >= heatOffZoom;
        const isCurrAbove = currentZoom >= heatOffZoom;
        if (wasPrevAbove !== isCurrAbove) {
          setVisibleHeat(isCurrAbove ? heatmapTypes.NONE : currentPrimary);
        }
      }
    }

    prevZoom.current = currentZoom;
  });

  useMapEvent('moveend', handleUpdate);

  useEffect(() => {
    handleUpdate();
  }, [handleUpdate]);

  // Feed data to the primary hexbin layer
  useEffect(() => {
    const heatDataMap = {
      [heatmapTypes.ENTRANCES]: entrances,
      [heatmapTypes.NETWORKS]: networks,
      [heatmapTypes.MASSIFS]: massifs
    };
    updateHeatData(heatDataMap[visibleHeat] ?? [], visibleHeat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleHeat, networks, entrances, massifs]);

  // Feed data to the secondary dots layer
  useEffect(() => {
    const dataByType = {
      [heatmapTypes.ENTRANCES]: entrances,
      [heatmapTypes.NETWORKS]: networks,
      [heatmapTypes.MASSIFS]: massifs
    };
    // Only show dots when in heat mode (not markers mode)
    const dotsToShow =
      zoomState.current === ZOOM_STATE.HEAT ? secondaryTypes : [];
    updateDots(dataByType, dotsToShow);
  }, [secondaryTypes, entrances, networks, massifs, updateDots, isMarkersMode]);

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
