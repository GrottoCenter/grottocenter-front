import { GpsFixed } from '@mui/icons-material';

import Rating from './Rating';
import Property from './Property';

const meta = {
  title: 'Properties'
};

export default meta;

export const RatingStory = {
  name: 'Rating',
  args: {
    value: 0
  },
  argTypes: {
    value: { control: { type: 'number' } }
  },
  render: ({ value }) => <Rating value={value} label="Rating" />
};

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
