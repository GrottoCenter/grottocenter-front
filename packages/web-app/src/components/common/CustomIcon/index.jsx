import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import {
  altitudeIcon,
  authorIcon,
  batIcon,
  bibliographyIcon,
  categoryIcon,
  caverIcon,
  cleanGearIcon,
  co2Icon,
  countryIcon,
  coordinatesIcon,
  coordinatesMarkerIcon,
  depthIcon,
  discoveryDateIcon,
  divingCaveIcon,
  entranceIcon,
  entranceMarkerIcon,
  floodingIcon,
  guidelinesIcon,
  lengthIcon,
  locationIcon,
  massifIcon,
  networkIcon,
  organizationIcon,
  pollutionIcon,
  rockfallIcon,
  rulesIcon,
  scientificObservationIcon,
  stayOnTrailIcon,
  temperatureIcon,
  timeToGoIcon,
  touristicIcon,
  undergroundTimeIcon
} from '../../../assets/icons';

const Icon = styled('span')`
  display: flex;
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
  author: authorIcon,
  bat: batIcon,
  bibliography: bibliographyIcon,
  category: categoryIcon,
  caver: caverIcon,
  clean_gear: cleanGearIcon,
  co2: co2Icon,
  country: countryIcon,
  coordinates: coordinatesIcon,
  coordinates_marker: coordinatesMarkerIcon,
  depth: depthIcon,
  discovery_date: discoveryDateIcon,
  diving_cave: divingCaveIcon,
  entrance: entranceIcon,
  entrance_marker: entranceMarkerIcon,
  flooding: floodingIcon,
  guidelines: guidelinesIcon,
  length: lengthIcon,
  location: locationIcon,
  massif: massifIcon,
  network: networkIcon,
  organization: organizationIcon,
  pollution: pollutionIcon,
  rockfall: rockfallIcon,
  rules: rulesIcon,
  scientific_observation: scientificObservationIcon,
  stay_on_trail: stayOnTrailIcon,
  temperature: temperatureIcon,
  time_to_go: timeToGoIcon,
  touristic: touristicIcon,
  underground_time: undergroundTimeIcon
};

const altTexts = {
  altitude: 'Altitude',
  author: 'Author',
  bat: 'Bat',
  bibliography: 'Bibliography',
  category: 'Category',
  caver: 'Caver',
  clean_gear: 'Clean gear',
  co2: 'CO2',
  country: 'Country',
  coordinates: 'Coordinates',
  coordinates_marker: 'Coordinates marker',
  depth: 'Depth',
  discovery_date: 'Discovery date',
  diving_cave: 'Diving cave',
  entrance: 'Entrance',
  entrance_marker: 'Entrance marker',
  flooding: 'Flooding',
  guidelines: 'Guidelines',
  length: 'Length',
  location: 'Location',
  massif: 'Massif',
  network: 'Network',
  organization: 'Organization',
  pollution: 'Pollution',
  rockfall: 'Rockfall',
  rules: 'Rules',
  scientific_observation: 'Scientific observation',
  stay_on_trail: 'Stay on trail',
  temperature: 'Temperature',
  time_to_go: 'Time to go',
  touristic: 'Touristic',
  underground_time: 'Underground time'
};

const CustomIcon = ({ type, size = 35 }) => (
  <Icon size={size}>
    <Img
      src={iconSources[type]}
      alt={altTexts[type] ?? type}
      height={size}
      width={size}
    />
  </Icon>
);

CustomIcon.propTypes = {
  type: PropTypes.oneOf(Object.keys(iconSources)).isRequired,
  size: PropTypes.number
};

export default CustomIcon;
