import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap, useMapEvent } from 'react-leaflet';
import { without, pipe, append, uniq } from 'ramda';

import DataControl, { heatmapTypes, markerTypes } from './DataControl';
import ConverterControl from '../common/Converter';
import GeocodingControl from '../common/GeocodingControl';
import useHeatLayer, { HexGlobalCss } from './useHeatLayer';
import Markers from './Markers';
import CustomMapContainer from '../common/MapContainer';
import { MARKERS_LIMIT } from './constants';

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
  projectionsList,
  onUpdate
}) => {
  const { updateHeatData } = useHeatLayer(entrances);
  const [selectedHeat, setSelectedHeat] = useState(heatmapTypes.ENTRANCES);
  const [selectedMarkers, setSelectedMarkers] = useState(
    Object.fromEntries(Object.values(markerTypes).map(type => [type, false]))
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

  const handleUpdate = useCallback(() => {
    onUpdateRef.current({
      markers: visibleMarkers,
      zoom: map.getZoom(),
      center: map.getCenter(),
      bounds: map.getBounds()
    });
  }, [visibleMarkers, map]);

  useEffect(() => {
    if (zoomState.current === ZOOM_STATE.MARKERS) {
      setVisibleMarkers(
        pipe(append(selectedHeat), uniq, without('none'))(selectedMarkersList)
      );
    } else {
      setVisibleMarkers(selectedMarkersList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMarkers]);

  const handleOrganizationSelect = useCallback(() => {
    setSelectedMarkers(prev => ({
      ...prev,
      [markerTypes.ORGANIZATIONS]: true
    }));
  }, []);

  const handleUpdateHeat = useCallback(newHeat => {
    setSelectedHeat(newHeat);
    if (zoomState.current === ZOOM_STATE.HEAT) {
      setVisibleHeat(newHeat);
    } else {
      setVisibleMarkers(
        pipe(
          append(newHeat),
          uniq,
          without('none')
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
    // When close enough we want to display disable heatmap ans show markers
    if (isZoomingIn && currentZoom >= MARKERS_LIMIT) {
      // do not update visible markers if it's already displayed
      if (zoomState.current !== ZOOM_STATE.MARKERS) {
        setVisibleMarkers(
          pipe(
            append(selectedHeatRef.current),
            uniq,
            without('none')
          )(selectedMarkersListRef.current)
        );
        setVisibleHeat('none');
        zoomState.current = ZOOM_STATE.MARKERS;
      }
    } else if (!isZoomingIn && currentZoom < MARKERS_LIMIT) {
      // When too far we want to switch back to the heatmap
      setVisibleHeat(selectedHeatRef.current);
      setVisibleMarkers(selectedMarkersListRef.current);
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
  // handleUpdate is stable as long as visibleMarkers doesn't change,
  // so this effect only re-runs when the markers to fetch actually change.
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
      default:
        updateHeatData([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleHeat, networks, entrances]);

  return (
    <>
      {HexGlobalCss}
      <GeocodingControl onOrganizationSelect={handleOrganizationSelect} />
      <DataControl
        updateHeatmap={handleUpdateHeat}
        selectedMarkers={selectedMarkers}
        setSelectedMarkers={setSelectedMarkers}
      />
      <ConverterControl projectionsList={projectionsList} />
      <Markers
        visibleMarkers={visibleMarkers}
        organizations={organizations}
        networks={networkMarkers}
        entrances={entranceMarkers}
      />
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
