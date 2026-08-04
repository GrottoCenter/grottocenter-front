import React, { useCallback, useEffect, useRef } from 'react';
import { includes, values } from 'ramda';
import PropTypes from 'prop-types';
import { layerTypes } from './DataControl';
import useMarkers from '../common/Markers/useMarkers';
import { makeIconTooltip } from '../common/Markers/tooltipHelpers';
import useNetworkHighlight from './useNetworkHighlight';
import { getEntranceCircleStyle } from './constants';
import {
  OrganizationMarker,
  OrganizationPopup,
  EntrancePopup,
  NetworkMarker,
  NetworkPopup
} from '../common/Markers/Components';
import {
  entranceIcon,
  networkIcon,
  organizationIcon
} from '../../../../assets/icons';

const isEntrances = includes(layerTypes.ENTRANCES);
const isNetworks = includes(layerTypes.NETWORKS);
const isOrganizations = includes(layerTypes.ORGANIZATIONS);

const entrancePopup = entrance => <EntrancePopup entrance={entrance} />;
const entranceTip = entrance => makeIconTooltip(entranceIcon, entrance?.name);
const networkPopup = network => <NetworkPopup network={network} />;
const networkTip = network => makeIconTooltip(networkIcon, network?.name);
const organizationPopup = organization => (
  <OrganizationPopup organization={organization} />
);
const organizationTip = organization =>
  makeIconTooltip(organizationIcon, organization?.name);

const Markers = ({
  visibleMarkers,
  organizations = [],
  entrances = [],
  networks = []
}) => {
  const { showHighlight, hideHighlight } = useNetworkHighlight();
  // Keep the highlight visible while a network popup is open (touch devices have
  // no hover), and only hide on mouseout when nothing is pinned.
  const pinnedNetworkRef = useRef(null);

  const handleNetworkOver = showHighlight;
  const handleNetworkOut = useCallback(() => {
    if (pinnedNetworkRef.current == null) hideHighlight();
  }, [hideHighlight]);
  const handleNetworkPopupOpen = useCallback(
    network => {
      pinnedNetworkRef.current = network.id;
      showHighlight(network);
    },
    [showHighlight]
  );
  const handleNetworkPopupClose = useCallback(() => {
    pinnedNetworkRef.current = null;
    hideHighlight();
  }, [hideHighlight]);

  const updateEntranceMarkers = useMarkers({
    circleMarkerStyle: getEntranceCircleStyle,
    popupContent: entrancePopup,
    tooltipContent: entranceTip
  });
  const updateNetworkMarkers = useMarkers({
    icon: NetworkMarker,
    popupContent: networkPopup,
    tooltipContent: networkTip,
    onMarkerOver: handleNetworkOver,
    onMarkerOut: handleNetworkOut,
    onPopupOpen: handleNetworkPopupOpen,
    onPopupClose: handleNetworkPopupClose
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
    const networksVisible = isNetworks(visibleMarkers);
    updateNetworkMarkers(networksVisible ? networks : null);
    // Drop any lingering highlight when the network layer is hidden.
    if (!networksVisible) {
      pinnedNetworkRef.current = null;
      hideHighlight();
    }
  }, [networks, visibleMarkers, updateNetworkMarkers, hideHighlight]);

  useEffect(() => {
    updateOrganizationMarkers(
      isOrganizations(visibleMarkers) ? organizations : null
    );
  }, [organizations, visibleMarkers, updateOrganizationMarkers]);

  return null;
};

const MemoizedMarkers = React.memo(Markers);

Markers.propTypes = {
  visibleMarkers: PropTypes.arrayOf(PropTypes.oneOf(values(layerTypes))),
  organizations: PropTypes.arrayOf(PropTypes.shape({})),
  entrances: PropTypes.arrayOf(PropTypes.shape({})),
  networks: PropTypes.arrayOf(PropTypes.shape({}))
};
MemoizedMarkers.propTypes = Markers.propTypes;

export default MemoizedMarkers;
