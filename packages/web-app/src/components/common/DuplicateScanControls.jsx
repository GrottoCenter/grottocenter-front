import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import FormSubmissionError from './FormSubmissionError';

const DuplicateScanControls = ({
  isLoading,
  hasStarted,
  hasCompleted,
  progress,
  progressMessageId,
  error = null,
  isOnline,
  hasIgnored,
  onAnalyze,
  onCancel,
  onShowIgnored,
  isDisabled = false
}) => {
  const { formatMessage } = useIntl();
  return (
    <>
      {isLoading && (
        <Box sx={{ mb: 2 }} aria-live="polite">
          <Typography>
            {formatMessage({ id: progressMessageId }, progress)}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <LinearProgress
              aria-label={formatMessage({ id: progressMessageId }, progress)}
              variant={progress.total > 0 ? 'determinate' : 'indeterminate'}
              value={
                progress.total > 0
                  ? Math.min(100, (progress.loaded / progress.total) * 100)
                  : undefined
              }
              sx={{ flexGrow: 1, minWidth: 0 }}
            />
            <Button variant="outlined" color="error" onClick={onCancel}>
              {formatMessage({ id: 'Cancel' })}
            </Button>
          </Box>
        </Box>
      )}
      {hasStarted && !isLoading && !hasCompleted && !error && (
        <Typography role="status">
          {formatMessage({ id: 'duplicates.cancelledScan' })}
        </Typography>
      )}
      {!isLoading && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            flexWrap: 'wrap',
            gap: 1,
            mb: 2
          }}>
          <Button onClick={onAnalyze} disabled={!isOnline || isDisabled}>
            {formatMessage({ id: 'duplicates.analyze' })}
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            disabled={!hasIgnored || isDisabled}
            onClick={onShowIgnored}>
            {formatMessage({ id: 'duplicates.showIgnored' })}
          </Button>
        </Box>
      )}
      {error && <FormSubmissionError error={error} />}
    </>
  );
};

DuplicateScanControls.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  hasStarted: PropTypes.bool.isRequired,
  hasCompleted: PropTypes.bool.isRequired,
  progress: PropTypes.shape({
    loaded: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  }).isRequired,
  progressMessageId: PropTypes.string.isRequired,
  error: FormSubmissionError.propTypes.error,
  isOnline: PropTypes.bool.isRequired,
  hasIgnored: PropTypes.bool.isRequired,
  onAnalyze: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onShowIgnored: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool
};

export default DuplicateScanControls;
