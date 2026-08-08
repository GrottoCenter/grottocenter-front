import React, {
  useCallback,
  useEffect,
  useRef,
  Suspense,
  useState,
  useMemo
} from 'react';
import { includes } from 'ramda';
import {
  useNavigate,
  generatePath,
  useParams,
  useSearchParams
} from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageLoader from '../components/common/PageLoader';

import {
  fetchNetworks,
  fetchAllNetworksCoordinates,
  fetchOrganizations,
  fetchAllOrganizationsCoordinates,
  fetchEntrances,
  fetchAllEntrancesCoordinates,
  fetchAllMassifsCoordinates,
  fetchMassifs,
  refetchMapViewport
} from '../actions/Map';
import { fetchProjections } from '../actions/Projections';
import useGeolocation from '../hooks/useGeolocation';
import useGeolocationPermission from '../hooks/useGeolocationPermission';
import { useRefetchOnReconnect } from '../hooks';
import 'leaflet/dist/leaflet.css';
import { defaultZoom, defaultCoord, focusZoom } from '../conf/config';

const MapClusters = React.lazy(
  () => import('../components/common/Maps/MapClusters')
);

const MAP_POSITION_KEY = 'grottocenter_map_position';

function getSavedPosition() {
  try {
    const saved = localStorage.getItem(MAP_POSITION_KEY);
    if (!saved) return null;
    const { lat, lng, zoom } = JSON.parse(saved);
    if (
      typeof lat !== 'number' ||
      typeof lng !== 'number' ||
      typeof zoom !== 'number'
    )
      return null;
    return { lat, lng, zoom };
  } catch {
    return null;
  }
}

function savePosition(center, zoom) {
  try {
    localStorage.setItem(
      MAP_POSITION_KEY,
      JSON.stringify({ lat: center.lat, lng: center.lng, zoom })
    );
  } catch {
    // ignore quota or private-mode errors
  }
}

const encodeMapTarget = (center, zoom) => `${center.lat},${center.lng},${zoom}`;

function decodeMapTarget(target) {
  if (!target) return null;
  const [lat, lng, zoom] = target.split(',');
  if (!lat || !lng || !zoom) return null;

  return {
    lng: parseFloat(lng),
    lat: parseFloat(lat),
    zoom: parseInt(zoom, 10)
  };
}

const Map = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const popupTarget = useMemo(() => {
    const param = searchParams.get('entity');
    if (!param) return null;
    const [type, idStr] = param.split(':');
    const id = parseInt(idStr, 10);
    if (!type || Number.isNaN(id)) return null;
    return { type, id };
  }, [searchParams]);
  const mapRef = useRef(null);
  const { current: initialTarget } = useRef(decodeMapTarget(params.target));
  const { current: savedPosition } = useRef(
    !initialTarget ? getSavedPosition() : null
  );
  // Centre the map on the user only when we have no target to restore — URL
  // param and localStorage take priority — AND the permission is already
  // granted, which we can read without asking for anything. Framing the initial
  // view is a convenience, and a convenience is never worth a permission dialog
  // the visitor did not ask for by pressing anything.
  const geolocationPermission = useGeolocationPermission();
  const needsGeolocationFallback = !initialTarget && !savedPosition;
  const { location: geoLocation, hasLocation } = useGeolocation({
    enabled: needsGeolocationFallback && geolocationPermission === 'granted'
  });
  const [location, setLocation] = useState(() => {
    if (initialTarget)
      return { lat: initialTarget.lat, lng: initialTarget.lng };
    if (savedPosition)
      return { lat: savedPosition.lat, lng: savedPosition.lng };
    return defaultCoord;
  });
  const { current: zoom } = useRef(
    initialTarget?.zoom ?? savedPosition?.zoom ?? defaultZoom
  );
  const networks = useSelector(state => state.map.networks);
  const networksCoordinates = useSelector(
    state => state.map.networksCoordinates
  );
  const organizations = useSelector(state => state.map.organizations);
  const organizationsCoordinates = useSelector(
    state => state.map.organizationsCoordinates
  );
  const entrances = useSelector(state => state.map.entrances);
  const entrancesCoordinates = useSelector(
    state => state.map.entrancesCoordinates
  );
  const massifs = useSelector(state => state.map.massifs);
  const massifsCoordinates = useSelector(state => state.map.massifsCoordinates);
  const { open } = useSelector(state => state.sideMenu);
  // urlDebounceRef: update the URL only once the user has truly settled,
  // avoiding lagging due to URL updates.
  // Leaflet always handles the visual movement immediately on its own.
  const urlDebounceRef = useRef(null);

  const handleUpdate = useCallback(
    ({ markers, showMassifPolygons, zoom: newZoom, center, bounds }) => {
      const criteria = {
        sw_lat: bounds._southWest.wrap().lat,
        sw_lng: bounds._southWest.wrap().lng,
        ne_lat: bounds._northEast.wrap().lat,
        ne_lng: bounds._northEast.wrap().lng,
        zoom: newZoom
      };
      if (includes('organizations', markers)) {
        dispatch(fetchOrganizations(criteria));
      }
      if (includes('networks', markers)) {
        dispatch(fetchNetworks(criteria));
      }
      if (includes('entrances', markers)) {
        dispatch(fetchEntrances(criteria));
      }
      if (showMassifPolygons) {
        dispatch(fetchMassifs(criteria));
      }

      if (center.lat !== defaultCoord.lat || center.lng !== defaultCoord.lng) {
        savePosition(center, newZoom);
      }

      // Update the shareable URL after the user has settled
      if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
      urlDebounceRef.current = setTimeout(() => {
        urlDebounceRef.current = null;
        navigate(
          generatePath('/ui/map/:target', {
            target: encodeMapTarget(center, newZoom)
          }),
          { replace: true }
        );
      }, 1000);
    },
    [dispatch, navigate]
  );

  useEffect(
    () => () => {
      if (urlDebounceRef.current) clearTimeout(urlDebounceRef.current);
    },
    []
  );

  const loadMapData = useCallback(() => {
    dispatch(fetchProjections());
    dispatch(fetchAllEntrancesCoordinates());
    dispatch(fetchAllNetworksCoordinates());
    dispatch(fetchAllMassifsCoordinates());
    dispatch(fetchAllOrganizationsCoordinates());
  }, [dispatch]);

  useEffect(() => {
    loadMapData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Both halves of the map need waking up on reconnection, and neither does it
  // on its own: the cluster datasets are only fetched on mount, and the marker
  // tiles only on moveend — which is why leaving the page and coming back was
  // the only way to recover, panning being swallowed by the failure cooldown.
  //
  // Asymmetric on purpose: loadMapData() dispatches thunks, refetchMapViewport()
  // is a plain function call. mapTileCache owns its own dispatch reference (see
  // Map.js), so calling it directly is the correct shape — do not wrap it in
  // dispatch().
  const reloadMap = useCallback(() => {
    loadMapData();
    refetchMapViewport();
  }, [loadMapData]);
  useRefetchOnReconnect(reloadMap);

  // When there is no URL target and no saved position, fall back to geolocation once available.
  const initialTargetRef = useRef(params.target);
  useEffect(() => {
    if (
      !decodeMapTarget(initialTargetRef.current) &&
      !savedPosition &&
      geoLocation
    ) {
      setLocation(geoLocation);
    }
  }, [geoLocation, savedPosition]);

  useEffect(() => {
    const target = decodeMapTarget(params.target);
    const isDefaultTarget =
      target?.lat === defaultCoord.lat &&
      target?.lng === defaultCoord.lng &&
      target?.zoom === defaultZoom;

    if (
      hasLocation &&
      !savedPosition &&
      (!params.target || isDefaultTarget) &&
      mapRef.current
    ) {
      mapRef.current.setView([geoLocation.lat, geoLocation.lng], focusZoom);
    }
  }, [hasLocation, geoLocation, params.target, savedPosition]);

  return (
    <Suspense fallback={<PageLoader />}>
      <MapClusters
        center={[location.lat, location.lng]}
        zoom={zoom}
        entrances={entrancesCoordinates}
        entranceMarkers={entrances}
        networks={networksCoordinates}
        networkMarkers={networks}
        organizations={organizationsCoordinates}
        organizationMarkers={organizations}
        massifs={massifsCoordinates}
        massifPolygons={massifs}
        onUpdate={handleUpdate}
        isSideMenuOpen={open}
        mapRef={mapRef}
        popupTarget={popupTarget}
      />
    </Suspense>
  );
};

Map.propTypes = {};

export default Map;
