import { GpsFixed } from '@mui/icons-material';

import Property from './Property';

const meta = {
  title: 'Properties'
};

export default meta;

export const PropertyStory = {
  name: 'Property',
  render: () => (
    <Property
      label="Property"
      value="this is a value"
      icon={<GpsFixed fontSize="large" color="primary" />}
    />
  )
};
