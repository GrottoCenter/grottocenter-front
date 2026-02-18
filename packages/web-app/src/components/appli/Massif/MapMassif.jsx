import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import useHeatLayer, {
  HexGlobalCss
} from '../../common/Maps/MapClusters/useHeatLayer';
import useMarkers, {
  MarkerGlobalCss
} from '../../common/Maps/common/Markers/useMarkers';
import {
  EntranceMarker,
  EntrancePopup
} from '../../common/Maps/common/Markers/Components';
import { MARKERS_LIMIT } from '../../common/Maps/MapClusters/constants';
import { makeUrl } from '../../../actions/utils';
import {
  getMapEntrancesCoordinatesUrl,
  getMapEntrancesUrl
} from '../../../conf/apiRoutes';

const MapInternals = ({ geoJson, massifId }) => {
  const map = useMap();
  const zoomRef = useRef(map.getZoom());
  const { updateHeatData } = useHeatLayer();

  const updateEntranceMarkers = useMarkers({
    icon: EntranceMarker,
    popupContent: entrance => <EntrancePopup entrance={entrance} />,
    tooltipContent: entrance => entrance?.name
  });

  // Keep refs to the latest updater functions so fetchData never
  // captures a stale closure (hexLayer may not be ready on first render).
  const heatRef = useRef(updateHeatData);
  heatRef.current = updateHeatData;
  const markersRef = useRef(updateEntranceMarkers);
  markersRef.current = updateEntranceMarkers;

  const fetchData = useCallback(() => {
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    zoomRef.current = zoom;
    /* eslint-disable no-underscore-dangle */
    const criteria = {
      sw_lat: bounds._southWest.wrap().lat,
      sw_lng: bounds._southWest.wrap().lng,
      ne_lat: bounds._northEast.wrap().lat,
      ne_lng: bounds._northEast.wrap().lng,
      massif: massifId
    };
    /* eslint-enable no-underscore-dangle */

    const isHighZoom = zoom >= MARKERS_LIMIT;
    const url = isHighZoom
      ? getMapEntrancesUrl
      : getMapEntrancesCoordinatesUrl;

    fetch(makeUrl(url, criteria))
      .then(response => {
        if (!response.ok) return [];
        return response.json();
      })
      .then(data => {
        if (!Array.isArray(data)) return;
        if (isHighZoom) {
          heatRef.current([]);
          markersRef.current(data);
        } else {
          markersRef.current(null);
          heatRef.current(data);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, massifId]);

  useMapEvents({
    zoomend: fetchData,
    dragend: fetchData
  });

  useEffect(() => {
    const bounds = L.geoJSON(geoJson).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds);
    }
    fetchData();
  }, [map, geoJson, fetchData]);

  return (
    <>
      {HexGlobalCss}
      {MarkerGlobalCss}
    </>
  );
};

MapInternals.propTypes = {
  geoJson: PropTypes.shape({}).isRequired,
  massifId: PropTypes.number.isRequired
};

const MapMassif = ({ massifId, geogPolygon }) => {
  const geoJson = useMemo(() => JSON.parse(geogPolygon), [geogPolygon]);

  // Normalize to a displayable GeoJSON.
  // Leaflet's GeoJSON layer handles Polygon natively.
  // For MultiPolygon with multiple polygons, convert to FeatureCollection
  // so each polygon renders as a separate feature (proper union display).
  const displayGeoJson = useMemo(() => {
    if (geoJson.type === 'Polygon' || geoJson.coordinates.length === 1) {
      return geoJson;
    }

    return {
      type: 'FeatureCollection',
      features: geoJson.coordinates.map(coords => ({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: coords
        },
        properties: {}
      }))
    };
  }, [geoJson]);

  return (
    <CustomMapContainer
      wholePage={false}
      dragging
      viewport={null}
      scrollWheelZoom={false}>
      <GeoJSON data={displayGeoJson} />
      <MapInternals geoJson={geoJson} massifId={massifId} />
    </CustomMapContainer>
  );
};

MapMassif.propTypes = {
  geogPolygon: PropTypes.string.isRequired,
  massifId: PropTypes.number.isRequired
};

export default MapMassif;
