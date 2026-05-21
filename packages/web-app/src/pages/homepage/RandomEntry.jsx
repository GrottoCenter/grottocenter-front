import React from 'react';
import { Box } from '@mui/material';
import RandomEntryCardContainer from '../../containers/RandomEntryCardContainer';

const RandomEntry = () => (
  <Box
    sx={{
      maxWidth: 720,
      width: '100%',
      mx: 'auto',
      px: { xs: 2, sm: 0 },
      py: 4
    }}>
    <RandomEntryCardContainer />
  </Box>
);

export default RandomEntry;
