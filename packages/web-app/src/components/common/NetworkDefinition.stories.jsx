import { Box, Typography } from '@mui/material';

import NetworkDefinition from './NetworkDefinition';
import NetworkDefinitionHelp from './NetworkDefinitionHelp';

const meta = {
  title: 'Common/NetworkDefinition',
  component: NetworkDefinition
};
export default meta;

export const Visible = {};

export const Help = {
  render: () => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Typography>Network</Typography>
      <NetworkDefinitionHelp />
    </Box>
  )
};
