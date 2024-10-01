import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { Box, Button, ButtonGroup, Tooltip } from '@mui/material';
import {
  CalendarToday,
  Category,
  GpsFixed,
  Height,
  Public,
  Terrain,
  Thermostat,
  Waves,
  Place,
  Map,
  FlagRounded
} from '@mui/icons-material';
import Alert from '../../common/Alert';
import CustomIcon from '../../common/CustomIcon';
import { Property } from '../../common/Properties';
import Ratings from './Ratings';
import { EntrancePropTypes } from '../../../types/entrance.type';

const GlobalWrapper = styled('div')`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(2)};
`;

const SmallRatingsWrapper = styled('div')`
  transform: scale(0.85);
`;

const FlexContainer = styled('div')`
  display: flex;
  justify-content: start;
  align-items: center;
`;
const FlexContainerGrow = styled('div')`
  flex-grow: 1;
`;
const StyledRatings = styled(Ratings)`
  justify-content: space-evenly;
`;
const computePrecisionSeverity = precision => {
  if (precision === undefined || precision === null) return 'warning';
  if (precision === 0) return 'error';
  return 'success';
};

const Properties = ({ isLoading = false, entrance }) => {
  const { formatMessage } = useIntl();

  let precisionText = '';
  if (entrance.precision === 0) {
    precisionText = formatMessage({
      id: 'Coordinates precision unavailable for restricted access entrance.'
    });
  } else if (entrance.precision !== undefined && entrance.precision !== null) {
    precisionText = formatMessage(
      {
        id: 'Coordinates precision: ±{precision}m',
        defaultMessage: 'Coordinates precision: ±{precision}m'
      },
      { precision: entrance.precision }
    );
  }

  const openOSM = () => {
    window.open(
      `https://www.openstreetmap.org/?mlat=${entrance.latitude}&mlon=${entrance.longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };
  const openGM = () => {
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${entrance.latitude},${entrance.longitude}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <GlobalWrapper>
      <Box display="flex" flexDirection="column">
        {entrance.latitude && entrance.longitude && (
          <FlexContainer>
            <FlexContainerGrow>
              <Property
                loading={isLoading}
                label={`${formatMessage({ id: 'Coordinates' })} (WGS84)`}
                value={`${formatMessage({ id: 'Lat.' })} (N) / ${formatMessage({
                  id: 'Long.'
                })} (E) = ${entrance.latitude.toFixed(
                  4
                )}, ${entrance.longitude.toFixed(4)}`}
                icon={<GpsFixed fontSize="large" color="primary" />}
              />
            </FlexContainerGrow>
            <div>
              <ButtonGroup color="primary" variant="outlined" size="small">
                <Tooltip title={formatMessage({ id: 'Open on OpenStreetMap' })}>
                  <Button onClick={openOSM} startIcon={<Map />}>
                    OSM
                  </Button>
                </Tooltip>
                <Tooltip title={formatMessage({ id: 'Open on Google Maps' })}>
                  <Button onClick={openGM} startIcon={<Place />}>
                    GMaps
                  </Button>
                </Tooltip>
              </ButtonGroup>
            </div>
          </FlexContainer>
        )}
        {precisionText && (
          <Alert
            severity={computePrecisionSeverity(entrance.precision)}
            content={precisionText}
          />
        )}
        <Box
          display="flex"
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="flex-start">
          <Property
            loading={isLoading}
            label={formatMessage({ id: 'Country' })}
            value={entrance.country}
            url={`/ui/countries/${entrance.country}`}
            icon={<FlagRounded fontSize="large" color="primary" />}
            secondary
          />
          <Property
            flexBasis="fill"
            loading={isLoading}
            label={formatMessage({ id: 'Location' })}
            value={[entrance.city, entrance.region]
              .flatMap(f => (f ? [f] : []))
              .join(', ')}
            icon={<Public fontSize="large" color="primary" />}
            secondary
          />
        </Box>
        <Box
          display="flex"
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="flex-start">
          {entrance.massif && (
            <Property
              label={formatMessage({ id: 'Massif' })}
              value={entrance.massif.name}
              icon={<Terrain fontSize="large" color="primary" />}
              url={`/ui/massifs/${entrance.massif.id}`}
            />
          )}
          {entrance.cave && entrance.cave.entrances.length > 1 && (
            <Property
              flexBasis="fit-content"
              label={formatMessage({ id: 'Cave' })}
              value={`${entrance.cave.name}`}
              icon={<CustomIcon type="cave_system" />}
              url={`/ui/caves/${entrance.cave.id}`}
            />
          )}
        </Box>
      </Box>
      <Box
        display="flex"
        flexDirection="row"
        flexWrap="wrap"
        justifyContent="flex-start">
        {!!entrance.cave?.depth && (
          <Property
            loading={isLoading}
            label={formatMessage({ id: 'Depth' })}
            value={`${entrance.cave.depth} m`}
            icon={<CustomIcon type="depth" />}
          />
        )}
        {!!entrance.cave?.length && (
          <Property
            loading={isLoading}
            label={formatMessage({ id: 'Development' })}
            value={`${entrance.cave.length} m`}
            icon={<CustomIcon type="length" />}
          />
        )}
        {!!entrance.altitude && (
          <Property
            label={formatMessage({ id: 'Altitude' })}
            value={`${entrance.altitude} m`}
            icon={<Height color="primary" />}
          />
        )}
        {!!entrance.cave?.temperature && (
          <Property
            loading={isLoading}
            label={formatMessage({ id: 'Temperature' })}
            value={`${entrance.cave.temperature} °C`}
            icon={<Thermostat fontSize="large" color="primary" />}
          />
        )}
        {!!entrance.discoveryYear && (
          <Property
            label={formatMessage({ id: 'Year of discovery' })}
            value={entrance.discoveryYear}
            icon={<CalendarToday color="primary" />}
          />
        )}
        {!!entrance.massif?.undergroundType && (
          <Property
            label={formatMessage({ id: 'Underground type' })}
            value={entrance.undergroundType}
            icon={<Category color="primary" />}
          />
        )}
        {!!entrance.cave?.isDiving && (
          <Property
            value={formatMessage({
              id: 'Diving cave'
            })}
            icon={<Waves color="primary" />}
            secondary
          />
        )}
      </Box>
      {!!entrance.stats &&
        !!entrance.stats.approach &&
        !!entrance.stats.aestheticism &&
        !!entrance.stats.caving && (
          <SmallRatingsWrapper>
            <StyledRatings
              access={entrance.stats.approach}
              interest={entrance.stats.aestheticism}
              progression={entrance.stats.caving}
            />
          </SmallRatingsWrapper>
        )}
    </GlobalWrapper>
  );
};

Properties.propTypes = {
  isLoading: PropTypes.bool,
  entrance: EntrancePropTypes
};

export default Properties;
