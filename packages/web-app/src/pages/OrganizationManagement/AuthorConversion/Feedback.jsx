import PropTypes from 'prop-types';
import { Alert, LinearProgress, Stack, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import FormSubmissionError from '@/components/common/FormSubmissionError';
import AppLink from '@/components/common/AppLink';

export const blockerShape = PropTypes.shape({
  key: PropTypes.string.isRequired,
  count: PropTypes.number.isRequired
});

export const snapshotShape = PropTypes.shape({
  version: PropTypes.number.isRequired,
  analyzedAt: PropTypes.number.isRequired,
  deleted: PropTypes.objectOf(PropTypes.number).isRequired,
  pending: PropTypes.objectOf(PropTypes.number).isRequired
});

export const Blockers = ({ blockers }) => {
  const { formatMessage } = useIntl();
  if (!blockers.length) return null;
  return (
    <Alert severity="warning" data-testid="conversion-blockers">
      <Typography>
        {formatMessage({ id: 'organizationConversion.blocked' })}
      </Typography>
      <Stack component="ul" sx={{ my: 0.5, pl: 2.5 }}>
        {blockers.map(({ key, count }) => (
          <Typography component="li" variant="body2" key={key}>
            {formatMessage({ id: `organizationConversion.${key}` })}: {count}
          </Typography>
        ))}
      </Stack>
    </Alert>
  );
};

Blockers.propTypes = { blockers: PropTypes.arrayOf(blockerShape).isRequired };

const DocumentReference = ({ id }) => {
  const { formatMessage } = useIntl();
  return (
    <AppLink to={`/ui/documents/${id}`} openInNewTabDesktop>
      {formatMessage({ id: 'Document' })} #{id}
    </AppLink>
  );
};

DocumentReference.propTypes = {
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired
};

export const CleanupError = ({ error = null }) => {
  const { formatMessage } = useIntl();
  if (!error) return null;
  let message = <FormSubmissionError error={error} />;
  if (error?.code?.startsWith('organizationConversion.')) {
    message = (
      <Alert severity="error">
        {formatMessage({ id: error.code }, error.values)}
      </Alert>
    );
  }
  return (
    <Stack spacing={0.5}>
      {message}
      {error.documentId && (
        <Typography variant="body2">
          <DocumentReference id={error.documentId} />
          {error.status && ` · HTTP ${error.status}`}
        </Typography>
      )}
    </Stack>
  );
};

CleanupError.propTypes = {
  error: PropTypes.shape({
    code: PropTypes.string,
    status: PropTypes.number,
    documentId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    values: PropTypes.shape({})
  })
};

export const Progress = ({ progress = null }) => {
  const { formatMessage } = useIntl();
  if (!progress) return null;
  return (
    <Stack spacing={1} role="status" aria-live="polite">
      <Typography>
        {formatMessage({ id: `organizationConversion.${progress.phase}` })}
        {progress.total > 0 && ` · ${progress.done} / ${progress.total}`}
      </Typography>
      {progress.documentId && <DocumentReference id={progress.documentId} />}
      <LinearProgress
        aria-label={formatMessage({
          id: `organizationConversion.${progress.phase}`
        })}
        variant={progress.total > 0 ? 'determinate' : 'indeterminate'}
        value={progress.total > 0 ? (100 * progress.done) / progress.total : 0}
      />
    </Stack>
  );
};

Progress.propTypes = {
  progress: PropTypes.shape({
    phase: PropTypes.string.isRequired,
    done: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired,
    documentId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};
