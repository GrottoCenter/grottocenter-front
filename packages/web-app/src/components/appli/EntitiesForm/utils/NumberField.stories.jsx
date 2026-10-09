import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import {
  NUMERIC_FIELD_LIMITS,
  getDiscoveryYearLimits
} from '@/utils/numericFieldLimits';

import NumberField from './NumberField';

const FIELDS = [
  {
    name: 'depth',
    label: 'Depth',
    icon: 'depth',
    unit: 'm',
    ...NUMERIC_FIELD_LIMITS.DEPTH
  },
  {
    name: 'length',
    label: 'Development',
    icon: 'length',
    unit: 'm',
    ...NUMERIC_FIELD_LIMITS.DEVELOPMENT
  },
  {
    name: 'temperature',
    label: 'Temperature',
    icon: 'temperature',
    unit: '°C'
  },
  {
    name: 'altitude',
    label: 'Altitude',
    icon: 'altitude',
    unit: 'm',
    ...NUMERIC_FIELD_LIMITS.ALTITUDE
  },
  {
    name: 'precision',
    label: 'Accuracy',
    prefix: '±',
    unit: 'm'
  },
  {
    name: 'yearDiscovery',
    label: 'Year of discovery',
    icon: 'discovery_date',
    min: -9999
  }
];

const NumberFieldsGroup = ({ disabled = false }) => {
  const { control } = useForm({
    mode: 'onTouched',
    defaultValues: Object.fromEntries(FIELDS.map(({ name }) => [name, '']))
  });
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {FIELDS.map(({ name, label, icon, prefix, unit, min, max }) => (
        <NumberField
          key={name}
          name={name}
          label={label}
          icon={icon}
          prefix={prefix}
          unit={unit}
          control={control}
          disabled={disabled}
          min={min}
          max={name === 'yearDiscovery' ? getDiscoveryYearLimits().max : max}
        />
      ))}
    </Box>
  );
};

NumberFieldsGroup.propTypes = {
  disabled: PropTypes.bool
};

const meta = {
  title: 'EntitiesForm/NumberField',
  component: NumberField
};
export default meta;

export const Group = {
  render: () => <NumberFieldsGroup />
};

export const Disabled = {
  render: () => <NumberFieldsGroup disabled />
};
