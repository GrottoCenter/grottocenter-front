import React from 'react';
import { storiesOf } from '@storybook/react';
import { Box } from '@mui/material';
import { useForm } from 'react-hook-form';

import NumberField from './NumberField';

const FIELDS = [
  { name: 'depth', label: 'Depth', icon: 'depth', unit: 'm' },
  { name: 'length', label: 'Development', icon: 'length', unit: 'm' },
  {
    name: 'temperature',
    label: 'Temperature',
    icon: 'temperature',
    unit: '°C'
  },
  { name: 'altitude', label: 'Altitude', icon: 'altitude', unit: 'm' },
  { name: 'yearDiscovery', label: 'Year of discovery', icon: 'discovery_date' }
];

const NumberFieldsGroup = ({ disabled = false }) => {
  const { control } = useForm({
    defaultValues: Object.fromEntries(FIELDS.map(({ name }) => [name, '']))
  });
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
      {FIELDS.map(({ name, label, icon, unit }) => (
        <NumberField
          key={name}
          name={name}
          label={label}
          icon={icon}
          unit={unit}
          control={control}
          disabled={disabled}
        />
      ))}
    </Box>
  );
};

storiesOf('EntitiesForm/NumberField', module)
  .add('group', () => <NumberFieldsGroup />)
  .add('disabled', () => <NumberFieldsGroup disabled />);
