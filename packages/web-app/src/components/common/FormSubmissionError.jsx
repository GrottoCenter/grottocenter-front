import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Alert, List, ListItem } from '@mui/material';

const FormSubmissionError = ({ error = null }) => {
  const { formatMessage } = useIntl();
  if (!error) return null;

  // Server failures must not expose internal messages or validation metadata.
  const isServerError = error.status >= 500;
  const code = error.body?.code ?? error.code;
  const fallback = formatMessage({
    id: isServerError
      ? 'A server error occurred'
      : 'An error occurred while saving.'
  });
  const message = isServerError
    ? fallback
    : error.body?.message || error.message || fallback;
  const details = isServerError ? [] : (error.body?.metadata?.details ?? []);
  const detailMessages = [
    ...new Set(
      details
        .map(detail => (typeof detail === 'string' ? detail : detail?.message))
        .filter(Boolean)
    )
  ];

  return (
    <Alert severity="error" sx={{ my: 1 }}>
      {code && !isServerError
        ? formatMessage({ id: code, defaultMessage: message })
        : message}
      {detailMessages.length > 0 && (
        <List dense disablePadding>
          {detailMessages.map(detail => (
            <ListItem key={detail}>{detail}</ListItem>
          ))}
        </List>
      )}
    </Alert>
  );
};

FormSubmissionError.propTypes = {
  error: PropTypes.shape({
    status: PropTypes.number,
    code: PropTypes.string,
    message: PropTypes.string,
    body: PropTypes.shape({
      code: PropTypes.string,
      message: PropTypes.string,
      metadata: PropTypes.shape({
        details: PropTypes.arrayOf(
          PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({ message: PropTypes.string })
          ])
        )
      })
    })
  })
};

export default FormSubmissionError;
