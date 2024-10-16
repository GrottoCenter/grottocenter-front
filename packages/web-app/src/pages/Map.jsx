import React, { useEffect, Suspense } from 'react';
import { includes } from 'ramda';
import { useNavigate, generatePath, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import PageLoader from '../components/common/PageLoader';

import {
  changeLocation,
  changeZoom,
  fetchNetworks,
  fetchNetworksCoordinates,
  fetchOrganizations,
  fetchEntrances,
  fetchEntrancesCoordinates
} from '../actions/Map';
import { fetchProjections } from '../actions/Projections';
import 'leaflet/dist/leaflet.css';

const MapClusters = React.lazy(
  () => import('../components/common/Maps/MapClusters')
);

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
  const {
    location,
    zoom,
    // TODO handle loading
    // eslint-disable-next-line no-unused-vars
    loadings,
    networks,
    networksCoordinates,
    organizations,
    entrances,
    entrancesCoordinates
  } = useSelector(state => state.map);
  const { open } = useSelector(state => state.sideMenu);
  const { projections } = useSelector(state => state.projections);

  const handleUpdate = ({ heat, markers, zoom: newZoom, center, bounds }) => {
    const newPath = generatePath('/ui/map/:target', {
      target: encodeMapTarget(center, newZoom)
    });
    navigate(newPath, { replace: true });
    dispatch(changeLocation(center));
    dispatch(changeZoom(zoom));

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
    if (heat === 'networks') {
      dispatch(fetchNetworksCoordinates(criteria));
    }
    if (heat === 'entrances') {
      dispatch(fetchEntrancesCoordinates(criteria));
    }
  };

  useEffect(() => {
    dispatch(fetchProjections());
    const target = decodeMapTarget(params.target);
    if (!target) return;

    dispatch(changeLocation({ lat: target.lat, lng: target.lng }));
    dispatch(changeZoom(target.zoom));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Suspense fallback={<PageLoader />}>
      <MapClusters
        center={[location.lat, location.lng]}
        zoom={zoom}
        entrances={entrancesCoordinates}
        entranceMarkers={entrances}
        networks={networksCoordinates}
        networkMarkers={networks}
        organizations={organizations}
        onUpdate={handleUpdate}
        isSideMenuOpen={open}
        projectionsList={projections}
      />
    </Suspense>
  );
};

Map.propTypes = {};

export default Map;
