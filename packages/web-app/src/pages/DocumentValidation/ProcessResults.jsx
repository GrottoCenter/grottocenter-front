import PropTypes from 'prop-types';
import { Alert, Box, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import { DOCUMENT_PROCESS_STATUSES } from '@/utils/documentProcessResults';

const ProcessResults = ({ batches }) => {
  const { formatMessage } = useIntl();
  const anomalyBatches = batches.filter(batch =>
    batch.results.some(result =>
      ['auto_rejected', 'not_found', 'error', 'indeterminate'].includes(
        result.status
      )
    )
  );
  if (!anomalyBatches.length) return null;
  return (
    <Box data-testid="document-process-results" sx={{ my: 1 }}>
      {anomalyBatches.map(batch => (
        <Box key={batch.key} sx={{ mb: 1 }}>
          {batch.results
            .filter(result =>
              ['auto_rejected', 'not_found', 'error', 'indeterminate'].includes(
                result.status
              )
            )
            .map(result => (
              <Alert
                key={result.id}
                severity={
                  ['error', 'indeterminate'].includes(result.status)
                    ? 'error'
                    : 'warning'
                }
                data-testid={`document-process-result-${result.id}`}
                sx={{ mb: 0.5, overflowWrap: 'anywhere' }}>
                <Typography component="p">
                  #{result.id}
                  {result.title ? ` — ${result.title}` : ''} — {result.status}
                  {' — '}
                  {formatMessage(
                    { id: `documentProcess.count.${result.status}` },
                    { count: 1 }
                  )}
                </Typography>
                {result.status === 'error'
                  ? formatMessage({ id: 'processDocumentsGenericError' })
                  : result.reason}
                {['error', 'indeterminate'].includes(result.status) && (
                  <Typography component="p">
                    {formatMessage({ id: 'documentProcess.noAutomaticRetry' })}
                  </Typography>
                )}
              </Alert>
            ))}
        </Box>
      ))}
    </Box>
  );
};

export const processBatchesPropType = PropTypes.arrayOf(
  PropTypes.shape({
    key: PropTypes.number.isRequired,
    results: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        status: PropTypes.oneOf(DOCUMENT_PROCESS_STATUSES).isRequired,
        title: PropTypes.string,
        reason: PropTypes.string
      })
    ).isRequired
  })
);

ProcessResults.propTypes = {
  batches: processBatchesPropType.isRequired
};

export default ProcessResults;
