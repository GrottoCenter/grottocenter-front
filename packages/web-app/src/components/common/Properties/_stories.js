import React from 'react';
import { storiesOf } from '@storybook/react';
import { number } from '@storybook/addon-knobs';
import { GpsFixed } from '@mui/icons-material';

import Rating from './Rating';
import Property from './Property';

storiesOf('Properties', module)
  .add('Rating', () => <Rating value={number('rating', 0)} label="Rating" />)
  .add('Property', () => (
    <Property
      label="Property"
      value="this is a value"
      icon={<GpsFixed fontSize="large" color="primary" />}
    />
  ));
