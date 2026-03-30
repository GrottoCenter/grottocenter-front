import React from 'react';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';
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
      icon={<CustomIcon type="massif" />}
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
      icon={<CustomIcon type="diving_cave" />}
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
      icon={<CustomIcon type="temperature" />}
    />
  );
};

export const OrganizationProperty = ({ organization }) => (
  <Property
    key={organization.id}
    value={organization.name}
    url={`/ui/organizations/${organization.id}`}
    icon={<CustomIcon type="organization" />}
    secondary
  />
);

export const HasBatProperty = ({ hasBat, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!hasBat) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Bat habitat' })}
      icon={<CustomIcon type="bat" />}
      secondary
    />
  );
};

export const DangerFloodingProperty = ({ dangerFlooding, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!dangerFlooding) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Flooding risk' })}
      icon={<CustomIcon type="flooding" />}
      secondary
    />
  );
};

export const DangerCO2Property = ({ dangerCO2, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!dangerCO2) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'CO2 risk' })}
      icon={<CustomIcon type="co2" />}
      secondary
    />
  );
};

export const NeedCleanGearProperty = ({ needCleanGear, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!needCleanGear) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Clean gear required' })}
      icon={<CustomIcon type="clean_gear" />}
      secondary
    />
  );
};

export const DangerPollutionProperty = ({ dangerPollution, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!dangerPollution) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Pollution risk' })}
      icon={<CustomIcon type="pollution" />}
      secondary
    />
  );
};

export const DangerRockfallProperty = ({ dangerRockfall, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!dangerRockfall) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Rockfall risk' })}
      icon={<CustomIcon type="rockfall" />}
      secondary
    />
  );
};

export const HasRulesProperty = ({ hasRules, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!hasRules) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Entry rules' })}
      icon={<CustomIcon type="rules" />}
      secondary
    />
  );
};

export const NeedStayOnTrailProperty = ({ needStayOnTrail, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!needStayOnTrail) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Stay on trail' })}
      icon={<CustomIcon type="stay_on_trail" />}
      secondary
    />
  );
};

export const IsTouristicProperty = ({ isTouristic, isLoading }) => {
  const { formatMessage } = useIntl();
  if (!isTouristic) return null;
  return (
    <Property
      loading={isLoading}
      value={formatMessage({ id: 'Touristic site' })}
      icon={<CustomIcon type="touristic" />}
      secondary
    />
  );
};
