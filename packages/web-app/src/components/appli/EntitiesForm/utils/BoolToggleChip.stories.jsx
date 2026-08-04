import { Box } from '@mui/material';
import { useForm } from 'react-hook-form';

import BoolToggleChip from './BoolToggleChip';
import { ENTRANCE_BOOLEAN_CHARACTERISTICS } from '../../../../conf/entranceCharacteristics';

const ChipsGroup = () => {
  const { control } = useForm({
    defaultValues: Object.fromEntries(
      ENTRANCE_BOOLEAN_CHARACTERISTICS.map(({ field }) => [field, false])
    )
  });
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {ENTRANCE_BOOLEAN_CHARACTERISTICS.map(({ field, label, icon }) => (
        <BoolToggleChip
          key={field}
          name={field}
          label={label}
          icon={icon}
          control={control}
        />
      ))}
    </Box>
  );
};

const meta = {
  title: 'EntitiesForm/BoolToggleChip',
  component: BoolToggleChip
};
export default meta;

export const Group = {
  render: () => <ChipsGroup />
};
