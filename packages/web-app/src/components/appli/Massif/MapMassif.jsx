import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { GeoJSON, useMap, useMapEvent } from 'react-leaflet';
import PropTypes from 'prop-types';
import L from 'leaflet';

import CustomMapContainer from '../../common/Maps/common/MapContainer';
import ClusterLayer, {
  ClusterGlobalCss
} from '../../common/Maps/MapClusters/ClusterLayer';
import useMarkers from '../../common/Maps/common/Markers/useMarkers';
import { EntrancePopup } from '../../common/Maps/common/Markers/Components';
import {
  MASSIF_POLYGON_STYLE,
  getEntranceCircleStyle,
  MARKERS_LIMIT
} from '../../common/Maps/MapClusters/constants';
import { makeUrl } from '../../../actions/utils';
import {
  getMapEntrancesCoordinatesUrl,
  getMapEntrancesUrl
} from '../../../conf/apiRoutes';

const entrancePopup = entrance => <EntrancePopup entrance={entrance} />;
const entranceTip = entrance => entrance?.name;

// Creates a pane below overlayPane (z=400) so the massif polygon never covers
// the entrance circle markers that live in the default overlayPane.
const MASSIF_POLYGON_PANE = 'massifPolygonPane';
const MassifPolygonPane = () => {
  const map = useMap();
  useEffect(() => {
    if (!map.getPane(MASSIF_POLYGON_PANE)) {
      const pane = map.createPane(MASSIF_POLYGON_PANE);
      pane.style.zIndex = 350;
      pane.style.pointerEvents = 'none';
    }
  }, [map]);
  return null;
};

const MapInternals = ({ geoJson, massifId }) => {
  const map = useMap();

  const updateEntranceMarkers = useMarkers({
    circleMarkerStyle: getEntranceCircleStyle,
    popupContent: entrancePopup,
    tooltipContent: entranceTip
  });

  // Coordinates for the cluster layer. State (not ref) so ClusterLayer's
  // supercluster index rebuilds when the fetch lands.
  const [entranceCoordinates, setEntranceCoordinates] = useState([]);
  // Toggle between cluster view (low zoom) and real marker view (high zoom).
  const [showClusters, setShowClusters] = useState(
    map.getZoom() < MARKERS_LIMIT
  );

  // Ref to latest marker updater — keeps fetchMarkers free of its unstable identity.
  const markersRef = useRef(updateEntranceMarkers);
  markersRef.current = updateEntranceMarkers;

  // abortRef only guards the high-zoom viewport marker fetch below (line ~90).
  // The one-shot coordinates fetch further down manages its own AbortController
  // via the useEffect return; both are aborted on unmount independently.
  const abortRef = useRef(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  // Computed once; both the heat fetch and fitBounds need it.
  const massifBounds = useMemo(() => L.geoJSON(geoJson).getBounds(), [geoJson]);

  // moveend: at high zoom fetch viewport markers; at low zoom the cluster layer
  // (fed by `entranceCoordinates` state) takes over via the JSX.
  const fetchMarkers = useCallback(() => {
    const zoom = map.getZoom();
    if (zoom < MARKERS_LIMIT) {
      markersRef.current(null);
      setShowClusters(true);
      return;
    }

    setShowClusters(false);

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
  // The ClusterLayer builds a kD-tree from these coordinates and queries
  // only the visible bbox on each moveend — no re-fetch needed on pan/zoom.
  // After storing the data, re-run the current zoom logic (via fetchMarkersRef) so the
  // cluster layer is shown immediately if still at low zoom - avoids reading map.getZoom()
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
        setEntranceCoordinates(data);
        fetchMarkersRef.current();
      })
      .catch(() => {});
    return () => controller.abort();
  }, [massifBounds, massifId]);

  // Fit the map to the massif bounds once, triggering moveend → fetchMarkers.
  // If there's no polygon, moveend won't fire, so we call fetchMarkers manually.
  // Guard: if the map is hidden (tab not active), dimensions are 0×0 and fitBounds
  // produces NaN coordinates that crash Leaflet's rendering. Observe the container
  // directly and defer fitBounds until it has real dimensions. The setTimeout lets
  // MapContainer's ResizeObserver (which calls invalidateSize) run first.
  useEffect(() => {
    if (!massifBounds.isValid()) {
      fetchMarkersRef.current();
      return;
    }
    const container = map.getContainer();
    if (container.offsetWidth > 0 && container.offsetHeight > 0) {
      map.fitBounds(massifBounds);
      return;
    }
    const observer = new ResizeObserver(() => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        observer.disconnect();
        setTimeout(() => map.fitBounds(massifBounds), 0);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [massifBounds, map]);

  return (
    <>
      {ClusterGlobalCss}
      <ClusterLayer
        data={entranceCoordinates}
        type="entrance"
        enabled={showClusters}
      />
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
      dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
      viewport={null}
      scrollWheelZoom={false}>
      {/* MassifPolygonPane must render before GeoJSON so its useEffect (pane
          creation) runs first and the pane exists when the layer is added. */}
      <MassifPolygonPane />
      {/* pane zIndex 350 keeps the polygon below overlayPane (400) where
          entrance circle markers live — fixes polygon covering entrances.
          SVG renderer in the same pane avoids the 0×0 canvas tab-hidden bug. */}
      <GeoJSON
        data={displayGeoJson}
        style={MASSIF_POLYGON_STYLE}
        interactive={false}
        pane={MASSIF_POLYGON_PANE}
        renderer={L.svg({ pane: MASSIF_POLYGON_PANE })}
      />
      <MapInternals geoJson={geoJson} massifId={massifId} />
    </CustomMapContainer>
  );
};

MapMassif.propTypes = {
  geogPolygon: PropTypes.string.isRequired,
  massifId: PropTypes.number.isRequired
};

export default MapMassif;
