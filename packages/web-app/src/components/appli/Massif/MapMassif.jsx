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

const MapInternals = ({ massifBounds, massifId }) => {
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
  const [showClusters, setShowClusters] = useState(false);
  const [isMapReady, setMapReady] = useState(false);
  const isMapReadyRef = useRef(false);

  // Ref to latest marker updater — keeps fetchMarkers free of its unstable identity.
  const markersRef = useRef(updateEntranceMarkers);
  markersRef.current = updateEntranceMarkers;

  // abortRef only guards the high-zoom viewport marker fetch below.
  // The one-shot coordinates fetch further down manages its own AbortController
  // via the useEffect return; both are aborted on unmount independently.
  const abortRef = useRef(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  // moveend: at high zoom fetch viewport markers; at low zoom the cluster layer
  // (fed by `entranceCoordinates` state) takes over via the JSX.
  const fetchMarkers = useCallback(() => {
    const zoom = map.getZoom();
    if (!isMapReadyRef.current || !Number.isFinite(zoom)) return;
    abortRef.current?.abort();
    if (zoom < MARKERS_LIMIT) {
      markersRef.current(null);
      setShowClusters(true);
      return;
    }

    setShowClusters(false);

    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    const bounds = map.getBounds();
    const criteria = {
      sw_lat: bounds._southWest.wrap().lat,
      sw_lng: bounds._southWest.wrap().lng,
      ne_lat: bounds._northEast.wrap().lat,
      ne_lng: bounds._northEast.wrap().lng,
      massif: massifId
    };

    fetch(makeUrl(getMapEntrancesUrl, criteria), { signal })
      .then(r => (r.ok ? r.json() : []))
      .then(data => {
        if (!signal.aborted && Array.isArray(data)) markersRef.current(data);
      })
      .catch(err => {
        if (err.name !== 'AbortError')
          console.error('Failed to fetch map markers:', err);
      });
  }, [map, massifId]);

  useMapEvent('moveend', fetchMarkers);

  useEffect(() => {
    const onReady = () => {
      isMapReadyRef.current = true;
      setMapReady(true);
      fetchMarkers();
    };
    map.whenReady(onReady);
    return () => {
      isMapReadyRef.current = false;
      map.off('load', onReady);
    };
  }, [map, fetchMarkers]);

  // One-shot heat fetch for the entire massif bbox.
  // The ClusterLayer builds a kD-tree from these coordinates and queries
  // only the visible bbox on each moveend — no re-fetch needed on pan/zoom.
  // Coordinates can arrive before a hidden map has its initial view. Readiness
  // and moveend control the active layer independently of this response.
  // MapMassif memoizes the validated bounds so this runs once per geometry/id.
  useEffect(() => {
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
        if (controller.signal.aborted || !Array.isArray(data)) return;
        setEntranceCoordinates(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [massifBounds, massifId]);

  // Fit the map to the massif bounds once, triggering moveend → fetchMarkers.
  // Guard: if the map is hidden (tab not active), dimensions are 0×0 and fitBounds
  // produces NaN coordinates that crash Leaflet's rendering. Observe the container
  // directly and defer fitBounds until it has real dimensions. The setTimeout lets
  // MapContainer's ResizeObserver (which calls invalidateSize) run first.
  useEffect(() => {
    const container = map.getContainer();
    const fitBounds = () => {
      if (container.offsetWidth === 0 || container.offsetHeight === 0)
        return false;
      map.invalidateSize({ animate: false, pan: false });
      map.fitBounds(massifBounds, { animate: false });
      return true;
    };
    if (fitBounds()) return undefined;
    let pendingFit;
    const observer = new ResizeObserver(() => {
      clearTimeout(pendingFit);
      pendingFit = setTimeout(() => {
        if (fitBounds()) observer.disconnect();
      }, 0);
    });
    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(pendingFit);
    };
  }, [massifBounds, map]);

  return (
    <>
      {ClusterGlobalCss}
      <ClusterLayer
        data={entranceCoordinates}
        type="entrance"
        enabled={isMapReady && showClusters}
      />
    </>
  );
};

MapInternals.propTypes = {
  massifBounds: PropTypes.shape({
    getSouthWest: PropTypes.func.isRequired,
    getNorthEast: PropTypes.func.isRequired
  }).isRequired,
  massifId: PropTypes.number.isRequired
};

const prepareGeometry = geogPolygon => {
  try {
    const geoJson = JSON.parse(geogPolygon);
    if (
      !geoJson ||
      !['Polygon', 'MultiPolygon'].includes(geoJson.type) ||
      !Array.isArray(geoJson.coordinates)
    )
      return null;
    const points = geoJson.coordinates.flat(geoJson.type === 'Polygon' ? 1 : 2);
    if (
      points.length === 0 ||
      points.some(
        point =>
          !Array.isArray(point) ||
          point.length < 2 ||
          !point.every(Number.isFinite)
      )
    )
      return null;
    const massifBounds = L.geoJSON(geoJson).getBounds();
    if (!massifBounds.isValid()) return null;
    const sw = massifBounds.getSouthWest();
    const ne = massifBounds.getNorthEast();
    if (![sw.lat, sw.lng, ne.lat, ne.lng].every(Number.isFinite)) return null;

    // Split a MultiPolygon into features so every polygon is displayed.
    const displayGeoJson =
      geoJson.type === 'Polygon' || geoJson.coordinates.length === 1
        ? geoJson
        : {
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
    return { displayGeoJson, massifBounds };
  } catch {
    // Missing or malformed geometry must not prevent viewing the massif.
    return null;
  }
};

const MapMassif = ({ massifId, geogPolygon }) => {
  const geometry = useMemo(() => prepareGeometry(geogPolygon), [geogPolygon]);
  if (!geometry) return null;
  const { displayGeoJson, massifBounds } = geometry;

  return (
    <CustomMapContainer
      wholePage={false}
      dragging={!isMobile} // For usability only use two fingers drag/zoom on mobile
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
      <MapInternals massifBounds={massifBounds} massifId={massifId} />
    </CustomMapContainer>
  );
};

MapMassif.propTypes = {
  geogPolygon: PropTypes.string.isRequired,
  massifId: PropTypes.number.isRequired
};

export default MapMassif;
