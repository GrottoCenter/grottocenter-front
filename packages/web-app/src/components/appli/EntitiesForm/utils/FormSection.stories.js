import { storiesOf } from '@storybook/react';
import { text } from '@storybook/addon-knobs';
import { Typography } from '@mui/material';

import { FormSection } from './FormContainers';

storiesOf('EntitiesForm/FormSection', module).add('default', () => (
  <FormSection title={text('Title', 'Location')}>
    <Typography variant="body2">
      Grouped fields for this section go here.
    </Typography>
  </FormSection>
));
