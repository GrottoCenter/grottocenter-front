import { Typography } from '@mui/material';

import NetworkInlineLink from './NetworkInlineLink';

const meta = {
  title: 'Common/NetworkInlineLink',
  component: NetworkInlineLink
};
export default meta;

export const Default = {
  render: () => (
    <Typography>
      This entrance belongs to the network{' '}
      <NetworkInlineLink caveId={123} label="Trou Qui Souffle" /> of 5
      entrances.
    </Typography>
  )
};

export const CustomSizeAndVariant = {
  render: () => (
    <Typography variant="body1">
      This entrance is part of{' '}
      <NetworkInlineLink
        caveId={123}
        label="Dent de Crolles"
        size={18}
        variant="body1"
      />{' '}
      which also has 2 descriptions.
    </Typography>
  )
};
