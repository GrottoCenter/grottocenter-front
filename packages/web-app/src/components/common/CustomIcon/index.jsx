import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import {
  altitudeIcon,
  bibliographyIcon,
  caverIcon,
  coordinatesIcon,
  depthIcon,
  entranceIcon,
  entranceMarkerIcon,
  lengthIcon,
  massifIcon,
  networkIcon,
  organizationIcon,
  timeToGoIcon,
  undergroundTimeIcon
} from '../../../assets/icons';

const Icon = styled('span')`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;
  margin: 0px 4px 0px 0px;
`;

const Img = styled('img')`
  padding: 0;
`;

const iconSources = {
  altitude: altitudeIcon,
  bibliography: bibliographyIcon,
  caver: caverIcon,
  coordinates: coordinatesIcon,
  depth: depthIcon,
  entrance: entranceIcon,
  entrance_marker: entranceMarkerIcon,
  length: lengthIcon,
  massif: massifIcon,
  network: networkIcon,
  organization: organizationIcon,
  time_to_go: timeToGoIcon,
  underground_time: undergroundTimeIcon
};

const CustomIcon = ({ type, size = 35 }) => (
  <Icon size={size}>
    <Img src={iconSources[type]} alt={type} height={size} width={size} />
  </Icon>
);

CustomIcon.propTypes = {
  type: PropTypes.oneOf(Object.keys(iconSources)).isRequired,
  size: PropTypes.number
};

export default CustomIcon;
