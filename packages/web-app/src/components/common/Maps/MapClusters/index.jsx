import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMapEvent } from 'react-leaflet';
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
  zoom,
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
  const [visibleHeat, setVisibleHeat] = useState(selectedHeat);
  const [visibleMarkers, setVisibleMarkers] = useState([]);
  const zoomState = useRef(ZOOM_STATE.HEAT);
  const prevZoom = useRef(zoom);
  // Refs to avoid stale closures in event handlers (zoomend, handleUpdateHeat)
  const selectedHeatRef = useRef(selectedHeat);
  selectedHeatRef.current = selectedHeat;
  const selectedMarkersListRef = useRef(selectedMarkersList);
  selectedMarkersListRef.current = selectedMarkersList;

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

  // on zoom handle what is visible between heat & markers
  const map = useMapEvent('zoomend', () => {
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
    }
    // When too far we want to switch back to the heatmap
    if (!isZoomingIn && currentZoom < MARKERS_LIMIT) {
      setVisibleHeat(selectedHeatRef.current);
      setVisibleMarkers(selectedMarkersListRef.current);
      zoomState.current = ZOOM_STATE.HEAT;
    }
    prevZoom.current = currentZoom;
  });

  const handleUpdate = () => {
    onUpdate({
      heat: visibleHeat === 'none' ? null : visibleHeat,
      markers: visibleMarkers,
      zoom: map.getZoom(),
      center: map.getCenter(),
      bounds: map.getBounds()
    });
  };

  // Update data on leaflet events or user events
  useMapEvent('zoomend', () => {
    handleUpdate();
  });
  useMapEvent('dragend', () => {
    handleUpdate();
  });
  useEffect(() => {
    handleUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMarkers, visibleHeat]);

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
    <HydratedMap {...props} zoom={zoom} />
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
  zoom: PropTypes.number.isRequired,
  onUpdate: PropTypes.func
};

Index.propTypes = {
  isSideMenuOpen: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number),
  mapRef: PropTypes.shape({ current: PropTypes.any }),
  ...HydratedMap.propTypes
};

export default Index;
