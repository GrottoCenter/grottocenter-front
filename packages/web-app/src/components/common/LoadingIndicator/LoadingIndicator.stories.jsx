import { Box } from '@mui/material';
import LoadingIndicator from './index';

const meta = {
  title: 'Common/LoadingIndicator',
  component: LoadingIndicator,
  parameters: { layout: 'centered' },
  argTypes: { progress: { control: { type: 'range', min: 0, max: 100 } } }
};
export default meta;

export const Indeterminate = {};
export const Determinate = { args: { progress: 42 } };
export const Starting = { args: { progress: 0 } };
export const Complete = { args: { progress: 100 } };

const onDarkBackground = Story => (
  <Box sx={{ bgcolor: 'grey.900', color: 'common.white', p: 3 }}>
    <Story />
  </Box>
);

export const DarkIndeterminate = { decorators: [onDarkBackground] };
export const DarkDeterminate = {
  args: { progress: 42 },
  decorators: [onDarkBackground]
};
