import React, { useEffect } from 'react';
import { includes, values } from 'ramda';
import PropTypes from 'prop-types';
import { heatmapTypes } from './DataControl';
import useMarkers, { MarkerGlobalCss } from '../common/Markers/useMarkers';
import { getEntranceCircleStyle } from './constants';
import {
  OrganizationMarker,
  OrganizationPopup,
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

const entrancePopup = entrance => <EntrancePopup entrance={entrance} />;
const entranceTip = entrance => entrance?.name;
const networkPopup = network => <NetworkPopup network={network} />;
const networkTip = network => network?.name;
const organizationPopup = organization => (
  <OrganizationPopup organization={organization} />
);
const organizationTip = organization => organization?.name;

const Markers = ({
  visibleMarkers,
  organizations = [],
  entrances = [],
  networks = []
}) => {
  const updateEntranceMarkers = useMarkers({
    circleMarkerStyle: getEntranceCircleStyle,
    popupContent: entrancePopup,
    tooltipContent: entranceTip
  });
  const updateNetworkMarkers = useMarkers({
    icon: NetworkMarker,
    popupContent: networkPopup,
    tooltipContent: networkTip
  });
  const updateOrganizationMarkers = useMarkers({
    icon: OrganizationMarker,
    popupContent: organizationPopup,
    tooltipContent: organizationTip
  });

  useEffect(() => {
    updateEntranceMarkers(isEntrances(visibleMarkers) ? entrances : null);
  }, [entrances, visibleMarkers, updateEntranceMarkers]);

  useEffect(() => {
    updateNetworkMarkers(isNetworks(visibleMarkers) ? networks : null);
  }, [networks, visibleMarkers, updateNetworkMarkers]);

  useEffect(() => {
    updateOrganizationMarkers(
      isOrganizations(visibleMarkers) ? organizations : null
    );
  }, [organizations, visibleMarkers, updateOrganizationMarkers]);

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
