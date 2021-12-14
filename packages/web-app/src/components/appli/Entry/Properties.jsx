import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import {
  CalendarToday,
  Category,
  GpsFixed,
  Public,
  Terrain,
  Title,
  TrendingUp,
  Waves
} from '@material-ui/icons';
import CustomIcon from '../../common/CustomIcon';
import { Property } from '../../common/Properties';
import { EntryContext, isValidCoordinates } from './Provider';
import Ratings from './Ratings';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)}px;
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
        mountain,
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
      id: 'Latitude'
    })}: ${coordinatesValue[0].toFixed(4)} - ${formatMessage({
      id: 'Longitude'
    })}: ${coordinatesValue[1].toFixed(4)}`;

  return (
    <Wrapper>
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
        />
        <Property
          loading={loading}
          label={formatMessage({ id: 'Depth' })}
          value={`${depth} m`}
          icon={<CustomIcon type="depth" />}
        />
        <Property
          loading={loading}
          label={formatMessage({ id: 'Development' })}
          value={`${development} m`}
          icon={<CustomIcon type="length" />}
        />
        <Property
          loading={loading}
          label={formatMessage({ id: 'Temperature' })}
          value={`${temperature} °C`}
          icon={<Title fontSize="large" color="primary" />}
          // TODO: The Thermostat icon is only available in MUI v5
          // icon={<Thermostat fontSize="large" color="primary"/>}
        />
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="space-evenly">
        {discoveryYear && (
          <Property
            label={formatMessage({ id: 'Year of discovery' })}
            value={discoveryYear}
            icon={<CalendarToday color="primary" />}
            secondary
          />
        )}
        {undergroundType && (
          <Property
            label={formatMessage({ id: 'Underground type' })}
            value={undergroundType}
            icon={<Category color="primary" />}
            secondary
          />
        )}
        {mountain && (
          <Property
            label={formatMessage({ id: 'Mountain range' })}
            value={mountain}
            icon={<Terrain color="primary" />}
            secondary
          />
        )}
        {altitude && (
          <Property
            label={formatMessage({ id: 'Altitude' })}
            value={`${altitude} m`}
            icon={<TrendingUp color="primary" />}
            secondary
          />
        )}
        {isDivingCave && (
          <Property
            label={formatMessage({ id: 'Diving cave' })}
            value={formatMessage({
              id: isDivingCave ? 'Diving cave' : 'Not diving'
            })}
            icon={<Waves color="primary" />}
            secondary
          />
        )}
      </Box>
      <Ratings
        accessRate={accessRate}
        interestRate={interestRate}
        progressionRate={progressionRate}
      />
    </Wrapper>
  );
};

export default Properties;
