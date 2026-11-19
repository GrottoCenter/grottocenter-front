import { useId } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, CircularProgress, Typography } from '@mui/material';

// Consumers own placement and contrast. Only supply progress when the source
// reports it; an unknown duration must not look like a measured percentage.
const LoadingIndicator = ({ progress = null, label = null }) => {
  const { formatMessage, formatNumber } = useIntl();
  const labelId = useId();
  const hasProgress = Number.isFinite(progress);
  const value = hasProgress
    ? Math.round(Math.min(100, Math.max(0, progress)))
    : 0;
  const loadingLabel = label ?? formatMessage({ id: 'Loading ...' });

  return (
    <Box
      data-testid="loading-indicator"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        width: 'fit-content',
        maxWidth: '100%',
        textAlign: 'center'
      }}>
      <CircularProgress
        variant={hasProgress ? 'determinate' : 'indeterminate'}
        value={hasProgress ? value : undefined}
        enableTrackSlot={hasProgress}
        size={32}
        color="inherit"
        aria-labelledby={labelId}
        sx={{
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
            '& .MuiCircularProgress-circle': { animation: 'none' }
          }
        }}
      />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          gap: 1
        }}>
        <Typography id={labelId} variant="body2">
          {loadingLabel}
        </Typography>
        {hasProgress && (
          <Typography
            variant="body2"
            aria-hidden="true"
            sx={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {formatNumber(value / 100, {
              style: 'percent',
              maximumFractionDigits: 0
            })}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

LoadingIndicator.propTypes = {
  progress: PropTypes.number,
  label: PropTypes.string
};

export default LoadingIndicator;
