import React, { useCallback, useEffect, useRef } from 'react';
import { includes, values } from 'ramda';
import PropTypes from 'prop-types';
import { getOrganizationIconSource } from '@/utils/organizationIcons';
import { isSurfaceMapPoint } from '@/utils/points';
import {
  PointMarker,
  shouldReplacePointMarker
} from '../common/Markers/Components/PointMarker';
import { PointPopup } from '../common/Markers/Components/PointPopup';
import { layerTypes } from './DataDisplayControl';
import useMarkers from '../common/Markers/useMarkers';
import { makeIconTooltip } from '../common/Markers/tooltipHelpers';
import useNetworkHighlight from './useNetworkHighlight';
import { getEntranceCircleStyle } from './constants';
import {
  getOrganizationMarker,
  shouldReplaceOrganizationMarker,
  OrganizationPopup,
  EntrancePopup,
  NetworkMarker,
  NetworkPopup
} from '../common/Markers/Components';
import { entranceIcon, networkIcon, pointIcon } from '../../../../assets/icons';

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
  makeIconTooltip(
    getOrganizationIconSource(organization?.type),
    organization?.name
  );
const pointPopup = point => <PointPopup point={point} />;
const pointTip = point => makeIconTooltip(pointIcon, point.label);

const Markers = ({
  visibleMarkers,
  organizations = [],
  entrances = [],
  networks = [],
  points = []
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
    icon: getOrganizationMarker,
    shouldReplaceMarker: shouldReplaceOrganizationMarker,
    popupContent: organizationPopup,
    tooltipContent: organizationTip
  });
  const updatePointMarkers = useMarkers({
    icon: PointMarker,
    popupContent: pointPopup,
    tooltipContent: pointTip,
    shouldReplaceMarker: shouldReplacePointMarker
  });

  useEffect(() => {
    updatePointMarkers(
      visibleMarkers.includes(layerTypes.POINTS)
        ? points.filter(isSurfaceMapPoint)
        : null
    );
  }, [points, visibleMarkers, updatePointMarkers]);

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
  networks: PropTypes.arrayOf(PropTypes.shape({})),
  points: PropTypes.arrayOf(PropTypes.shape({}))
};
MemoizedMarkers.propTypes = Markers.propTypes;

export default MemoizedMarkers;
