import React from 'react';
import PropTypes from 'prop-types';
import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useIntl } from 'react-intl';

const getColor = (value, theme) => {
  if (value >= 70) return theme.palette.success.main;
  if (value >= 40) return theme.palette.warning.main;
  return theme.palette.error.main;
};

const DataQualityBadge = ({ value, size = 40 }) => {
  const theme = useTheme();
  const { formatMessage } = useIntl();
  const color = getColor(value, theme);

  return (
    <Tooltip
      title={formatMessage(
        { id: 'Data quality score: {value}/100' },
        { value }
      )}>
      <Box position="relative" display="inline-flex" sx={{ flexShrink: 0 }}>
        <Box display="flex">
          <CircularProgress
            variant="determinate"
            value={100}
            size={size}
            sx={{ color: 'action.disabledBackground', position: 'absolute' }}
          />
          <CircularProgress
            variant="determinate"
            value={value}
            size={size}
            sx={{ color }}
          />
        </Box>
        <Box
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          right={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{ color }}>
          <Typography variant="caption" component="div" fontWeight={700}>
            {value}
          </Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

DataQualityBadge.propTypes = {
  value: PropTypes.number.isRequired,
  size: PropTypes.number
};

export default DataQualityBadge;
