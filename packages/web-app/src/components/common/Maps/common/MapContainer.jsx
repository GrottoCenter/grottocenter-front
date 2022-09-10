import React, { useEffect } from 'react';
import styled from 'styled-components';
import { isMobileOnly } from 'react-device-detect';
import { MapContainer, useMap } from 'react-leaflet';
import PropTypes from 'prop-types';
import LayersControl from './LayersControl';

const Map = styled(MapContainer)`
${({ wholePage, isSideMenuOpen, theme }) =>
  wholePage &&
  `width: calc(100% - ${isSideMenuOpen ? theme.sideMenuWidth : 0}px);`}
${({ wholePage }) => !wholePage && `width: auto;`}
${({ wholePage }) => (!wholePage ? `position: relative;` : `position: fixed;`)}
${({ wholePage, theme }) =>
  !wholePage && `margin-bottom: ${theme.spacing(2)}px;`}
${({ wholePage }) => !wholePage && `height: ${isMobileOnly ? '220' : '300'}px;`}
${({ wholePage, theme }) =>
  wholePage && `height: calc(100vh - ${theme.appBarHeight}px);`}
`;

// The Map, once mounted, doesn't change its center: this Centerer forces it
// See https://github.com/PaulLeCam/react-leaflet/issues/796#issuecomment-743181396
const Centerer = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
};

Centerer.propTypes = {
  center: PropTypes.arrayOf(PropTypes.number)
};

const CustomMapContainer = ({
  wholePage = true,
  center,
  zoom,
  dragging = true,
  scrollWheelZoom = true,
  isSideMenuOpen = false,
  style,
  children,
  forceCentering
}) => (
  <Map
    wholePage={wholePage}
    center={center}
    zoom={zoom}
    dragging={dragging}
    scrollWheelZoom={scrollWheelZoom}
    isSideMenuOpen={isSideMenuOpen}
    minZoom={0}
    style={style}
    preferCanvas>
    {forceCentering && <Centerer center={center} />}
    <LayersControl />
    {children}
  </Map>
);

CustomMapContainer.propTypes = {
  wholePage: PropTypes.bool,
  center: PropTypes.arrayOf(PropTypes.number),
  zoom: PropTypes.number,
  dragging: PropTypes.bool,
  scrollWheelZoom: PropTypes.bool,
  children: PropTypes.node,
  isSideMenuOpen: PropTypes.bool,
  style: PropTypes.shape({}),
  forceCentering: PropTypes.bool
};

export default CustomMapContainer;
