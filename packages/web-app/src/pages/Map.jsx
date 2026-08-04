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
  fetchMassifs
} from '../actions/Map';
import { fetchProjections } from '../actions/Projections';
import useGeolocation from '../hooks/useGeolocation';
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
  const { location: geoLocation, hasLocation } = useGeolocation();
  const mapRef = useRef(null);
  const { current: initialTarget } = useRef(decodeMapTarget(params.target));
  const { current: savedPosition } = useRef(
    !initialTarget ? getSavedPosition() : null
  );
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
        /* eslint-disable no-underscore-dangle */
        sw_lat: bounds._southWest.wrap().lat,
        sw_lng: bounds._southWest.wrap().lng,
        ne_lat: bounds._northEast.wrap().lat,
        ne_lng: bounds._northEast.wrap().lng,
        /* eslint-enable no-underscore-dangle */
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

  useEffect(() => {
    dispatch(fetchProjections());
    dispatch(fetchAllEntrancesCoordinates());
    dispatch(fetchAllNetworksCoordinates());
    dispatch(fetchAllMassifsCoordinates());
    dispatch(fetchAllOrganizationsCoordinates());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
