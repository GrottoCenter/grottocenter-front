import React from 'react';
import { Box, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useIntl } from 'react-intl';

const SensitiveLocationPlaceholder = () => {
  const { formatMessage } = useIntl();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        bgcolor: 'secondary.veryLight',
        borderRadius: 1,
        p: 2,
        gap: 0.5
      }}>
      <LockOutlinedIcon sx={{ fontSize: 48, color: 'secondary.main' }} />
      {/* Label of a status panel, not a section of the page: styled like a
          heading but kept out of the document outline. */}
      <Typography variant="h4" component="p" color="secondary.main">
        {formatMessage({ id: 'Sensitive location' })}
      </Typography>
      <Typography variant="body2" textAlign="center" color="text.secondary">
        {formatMessage({
          id: 'This entrance requires special protection measures. We do not communicate its precise location on Grottocenter.'
        })}
      </Typography>
    </Box>
  );
};

export default SensitiveLocationPlaceholder;
