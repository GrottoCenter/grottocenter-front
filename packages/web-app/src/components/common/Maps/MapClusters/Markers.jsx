import React, { useEffect } from 'react';
import { includes, values } from 'ramda';
import PropTypes from 'prop-types';

import { heatmapTypes } from './DataControl';
import useMarkers, { MarkerGlobalCss } from '../common/Markers/useMarkers';
import {
  OrganizationMarker,
  OrganizationPopup,
  EntranceMarker,
  EntrancePopup,
  NetworkMarker,
  NetworkPopup
} from '../common/Markers/Components';

export const markerTypes = {
  ORGANIZATIONS: 'organizations',
  ...heatmapTypes
};

const isEntrances = includes(markerTypes.ENTRANCES);
const isNetworks = includes(markerTypes.NETWORKS);
const isOrganizations = includes(markerTypes.ORGANIZATIONS);

const Markers = ({
  visibleMarkers,
  organizations = [],
  entrances = [],
  networks = []
}) => {
  const updateEntranceMarkers = useMarkers({
    icon: EntranceMarker,
    popupContent: entrance => <EntrancePopup entrance={entrance} />,
    tooltipContent: entrance => entrance?.name
  });
  const updateNetworkMarkers = useMarkers({
    icon: NetworkMarker,
    popupContent: network => <NetworkPopup network={network} />,
    tooltipContent: network => network?.name
  });
  const updateOrganizationMarkers = useMarkers({
    icon: OrganizationMarker,
    popupContent: organization => (
      <OrganizationPopup organization={organization} />
    ),
    tooltipContent: organization => organization?.name
  });

  useEffect(() => {
    if (isEntrances(visibleMarkers)) {
      updateEntranceMarkers(entrances);
    } else {
      updateEntranceMarkers(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entrances, visibleMarkers]);

  useEffect(() => {
    if (isNetworks(visibleMarkers)) {
      updateNetworkMarkers(networks);
    } else {
      updateNetworkMarkers(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networks, visibleMarkers]);

  useEffect(() => {
    if (isOrganizations(visibleMarkers)) {
      updateOrganizationMarkers(organizations);
    } else {
      updateOrganizationMarkers(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations, visibleMarkers]);

  return MarkerGlobalCss;
};

const MemoizedMarkers = React.memo(Markers);

Markers.propTypes = {
  visibleMarkers: PropTypes.arrayOf(PropTypes.oneOf(values(markerTypes))),
  organizations: PropTypes.arrayOf(PropTypes.shape({})),
  entrances: PropTypes.arrayOf(PropTypes.shape({})),
  networks: PropTypes.arrayOf(PropTypes.shape({}))
};
MemoizedMarkers.propTypes = Markers.propTypes;

export default MemoizedMarkers;
