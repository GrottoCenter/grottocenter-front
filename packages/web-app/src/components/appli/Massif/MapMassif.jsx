import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { GeoJSON, useMap, useMapEvent } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import useHeatLayer, {
  HexGlobalCss
} from '../../common/Maps/MapClusters/useHeatLayer';
import useMarkers, {
  MarkerGlobalCss
} from '../../common/Maps/common/Markers/useMarkers';
import { EntrancePopup } from '../../common/Maps/common/Markers/Components';
import {
  MASSIF_POLYGON_STYLE,
  getEntranceCircleStyle
} from '../../common/Maps/MapClusters/constants';
import { makeUrl } from '../../../actions/utils';
import {
  getMapEntrancesCoordinatesUrl,
  getMapEntrancesUrl
} from '../../../conf/apiRoutes';

const entrancePopup = entrance => <EntrancePopup entrance={entrance} />;
const entranceTip = entrance => entrance?.name;

const MapInternals = ({ geoJson, massifId }) => {
  const map = useMap();
  const { updateHeatData, heatOffZoom } = useHeatLayer();

  const updateEntranceMarkers = useMarkers({
    circleMarkerStyle: getEntranceCircleStyle,
    popupContent: entrancePopup,
    tooltipContent: entranceTip
  });

  // Refs to latest updaters — keeps fetchMarkers free of their unstable identities.
  const heatRef = useRef(updateHeatData);
  heatRef.current = updateHeatData;
  const markersRef = useRef(updateEntranceMarkers);
  markersRef.current = updateEntranceMarkers;

  const heatCoordinatesRef = useRef([]);
  const abortRef = useRef(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  // Computed once; both the heat fetch and fitBounds need it.
  const massifBounds = useMemo(() => L.geoJSON(geoJson).getBounds(), [geoJson]);

  // moveend: at high zoom fetch viewport markers; at low zoom restore heatmap from cache.
  const fetchMarkers = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom < heatOffZoom) {
      markersRef.current(null);
      heatRef.current(heatCoordinatesRef.current);
      return;
    }

    heatRef.current([]);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    const bounds = map.getBounds();
    /* eslint-disable no-underscore-dangle */
    const criteria = {
      sw_lat: bounds._southWest.wrap().lat,
      sw_lng: bounds._southWest.wrap().lng,
      ne_lat: bounds._northEast.wrap().lat,
      ne_lng: bounds._northEast.wrap().lng,
      massif: massifId
    };
    /* eslint-enable no-underscore-dangle */

    fetch(makeUrl(getMapEntrancesUrl, criteria), { signal })
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (Array.isArray(data)) markersRef.current(data);
      })
      .catch(err => {
        if (err.name !== 'AbortError')
          console.error('Failed to fetch map markers:', err); // eslint-disable-line no-console
      });
  }, [map, massifId]);

  // fetchMarkersRef lets effects call the latest fetchMarkers without adding it as a dep.
  const fetchMarkersRef = useRef(null);
  fetchMarkersRef.current = fetchMarkers;

  useMapEvent('moveend', fetchMarkers);

  // One-shot heat fetch for the entire massif bbox.
  // The hexbin layer filters client-side; no re-fetch needed on pan/zoom.
  // After storing the data, re-run the current zoom logic (via fetchMarkersRef) so the
  // heatmap is displayed immediately if still at low zoom - avoids reading map.getZoom()
  // asynchronously (race condition).
  //
  // Dep note: massifBounds is derived from geoJson via useMemo, and geoJson itself is
  // memoized on geogPolygon (a string prop) in MapMassif. Leaflet's LatLngBounds has no
  // referential equality, so this effect re-fires whenever massifBounds is a new object ;
  // which only happens when geoJson changes reference. As long as geoJson stays stable
  // (string prop → parsed once), this fires exactly once. If geoJson ever comes from
  // Redux or a fetch, ensure its reference is stable to avoid double-fetching here.
  useEffect(() => {
    if (!massifBounds.isValid()) return;
    const sw = massifBounds.getSouthWest();
    const ne = massifBounds.getNorthEast();
    const controller = new AbortController();
    fetch(
      makeUrl(getMapEntrancesCoordinatesUrl, {
        sw_lat: sw.lat,
        sw_lng: sw.lng,
        ne_lat: ne.lat,
        ne_lng: ne.lng,
        massif: massifId
      }),
      { signal: controller.signal }
    )
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (!Array.isArray(data)) return;
        heatCoordinatesRef.current = data;
        fetchMarkersRef.current();
      })
      .catch(() => {});
    return () => controller.abort();
  }, [massifBounds, massifId]);

  // Fit the map to the massif bounds once, triggering moveend → fetchMarkers.
  // If there's no polygon, moveend won't fire, so we call fetchMarkers manually.
  useEffect(() => {
    if (!massifBounds.isValid()) {
      fetchMarkersRef.current();
      return;
    }
    map.fitBounds(massifBounds);
  }, [massifBounds, map]);

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
      <GeoJSON data={displayGeoJson} style={MASSIF_POLYGON_STYLE} />
      <MapInternals geoJson={geoJson} massifId={massifId} />
    </CustomMapContainer>
  );
};

MapMassif.propTypes = {
  geogPolygon: PropTypes.string.isRequired,
  massifId: PropTypes.number.isRequired
};

export default MapMassif;
