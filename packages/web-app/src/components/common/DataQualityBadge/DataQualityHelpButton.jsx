import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Box, Divider, IconButton, Popover, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DataQualityComputeDetails from './DataQualityComputeDetails';

const DataQualityHelpButton = () => {
  const [anchor, setAnchor] = useState(null);
  const { formatMessage } = useIntl();

  return (
    <>
      <IconButton
        size="small"
        sx={{ color: 'text.secondary' }}
        onClick={e => setAnchor(e.currentTarget)}>
        <HelpOutlineIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { maxWidth: 700, width: '90vw' } } }}>
        <Box px={2} pt={2}>
          <Typography variant="h6">
            {formatMessage({ id: 'Data quality computation' })}
          </Typography>
        </Box>
        <Divider />
        <DataQualityComputeDetails />
      </Popover>
    </>
  );
};

export default DataQualityHelpButton;
