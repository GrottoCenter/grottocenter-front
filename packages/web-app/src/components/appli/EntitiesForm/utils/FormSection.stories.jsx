import { Typography } from '@mui/material';

import { FormSection } from './FormContainers';

const meta = {
  title: 'EntitiesForm/FormSection',
  component: FormSection
};
export default meta;

export const Default = {
  args: {
    title: 'Location',
    children: (
      <Typography variant="body2">
        Grouped fields for this section go here.
      </Typography>
    )
  }
};
