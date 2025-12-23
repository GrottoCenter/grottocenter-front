import React from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
import { Terrain, Waves, Thermostat } from '@mui/icons-material';
import CustomIcon from '../CustomIcon';
import { Property } from '../Properties';

export const SecondaryPropertiesWrapper = styled('div')`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
`;

export const DepthProperty = ({ depth, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!depth) return null;
  return (
    <Property
      loading={isLoading}
      label={formatMessage({ id: 'Depth' })}
      value={`${depth} m`}
      icon={<CustomIcon type="depth" />}
    />
  );
};

export const LengthProperty = ({ length, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!length) return null;
  return (
    <Property
      loading={isLoading}
      label={formatMessage({ id: 'Development' })}
      value={`${length} m`}
      icon={<CustomIcon type="length" />}
    />
  );
};

export const MassifProperty = ({ massif, secondary = false }) => {
  const { formatMessage } = useIntl();
  if (!massif) return null;
  return (
    <Property
      label={formatMessage({ id: 'Massif' })}
      value={massif.name}
      url={`/ui/massifs/${massif.id}`}
      icon={<Terrain color="primary" />}
      secondary={secondary}
    />
  );
};

export const DivingProperty = ({ isDiving, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!isDiving) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Diving cave' })}
      icon={<Waves color="primary" />}
      secondary
    />
  );
};

export const TemperatureProperty = ({ temperature, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!temperature) return null;
  return (
    <Property
      loading={isLoading}
      label={formatMessage({ id: 'Temperature' })}
      value={`${temperature} °C`}
      icon={<Thermostat fontSize="large" color="primary" />}
    />
  );
};

export const OrganizationProperty = ({ organization }) => (
  <Property
    key={organization.id}
    value={organization.name}
    url={`/ui/organizations/${organization.id}`}
    icon={
      <img
        src="/images/club.svg"
        alt="Organization icon"
        style={{ width: '35px' }}
      />
    }
    secondary
  />
);
