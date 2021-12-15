import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  CalendarToday,
  Category,
  GpsFixed,
  Height,
  Public,
  Terrain,
  Title,
  Waves
} from '@material-ui/icons';
import CustomIcon from '../../common/CustomIcon';
import { Property } from '../../common/Properties';
import { EntryContext, isValidCoordinates } from './Provider';
import Ratings from './Ratings';

const GlobalWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)}px;
`;

const SmallRatingsWrapper = styled.div`
  transform: scale(0.85);
`;

const Properties = () => {
  const {
    state: {
      details: {
        accessRate,
        altitude,
        coordinates,
        depth,
        development,
        discoveryYear,
        interestRate,
        isDivingCave,
        localisation,
        massif,
        progressionRate,
        temperature,
        undergroundType
      },
      loading
    }
  } = useContext(EntryContext);
  const { formatMessage } = useIntl();
  const makeCoordinatesValue = coordinatesValue =>
    `${formatMessage({
      id: 'Lat.'
    })} / ${formatMessage({ id: 'Long.' })} - 
    ${coordinatesValue[0].toFixed(4)} ${coordinatesValue[1].toFixed(4)}`;

  return (
    <GlobalWrapper>
      <Box display="flex" flexDirection="column">
        {isValidCoordinates(coordinates) && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Coordinates' })}
            value={makeCoordinatesValue(coordinates)}
            icon={<GpsFixed fontSize="large" color="primary" />}
          />
        )}
        <Property
          loading={loading}
          label={formatMessage({ id: 'Localisation' })}
          value={localisation}
          icon={<Public fontSize="large" color="primary" />}
          secondary
        />
        {massif && (
          <Property
            label={formatMessage({ id: 'Massif' })}
            value={massif.name}
            icon={<Terrain fontSize="large" color="primary" />}
            url={`/ui/massifs/${massif.id}`}
          />
        )}
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="space-evenly">
        {depth && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Depth' })}
            value={`${depth} m`}
            icon={<CustomIcon type="depth" />}
          />
        )}
        {altitude && (
          <Property
            label={formatMessage({ id: 'Altitude' })}
            value={`${altitude} m`}
            icon={<Height color="primary" />}
          />
        )}
        {development && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Development' })}
            value={`${development} m`}
            icon={<CustomIcon type="length" />}
          />
        )}
        {temperature && (
          <Property
            loading={loading}
            label={formatMessage({ id: 'Temperature' })}
            value={`${temperature} °C`}
            icon={<Title fontSize="large" color="primary" />}
            // TODO: The Thermostat icon is only available in MUI v5
            // icon={<Thermostat fontSize="large" color="primary"/>}
          />
        )}
        {discoveryYear && (
          <Property
            label={formatMessage({ id: 'Year of discovery' })}
            value={discoveryYear}
            icon={<CalendarToday color="primary" />}
          />
        )}
        {undergroundType && (
          <Property
            label={formatMessage({ id: 'Underground type' })}
            value={undergroundType}
            icon={<Category color="primary" />}
          />
        )}
        {isDivingCave && (
          <Property
            value={formatMessage({
              id: 'Diving cave'
            })}
            icon={<Waves color="primary" />}
          />
        )}
      </Box>
      <SmallRatingsWrapper>
        <Ratings
          accessRate={accessRate}
          interestRate={interestRate}
          progressionRate={progressionRate}
        />
      </SmallRatingsWrapper>
    </GlobalWrapper>
  );
};

export default Properties;
