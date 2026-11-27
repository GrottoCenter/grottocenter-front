import { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormHelperText } from '@mui/material';
import { useIntl } from 'react-intl';
import { DocumentFormContext } from './Provider';

const DocumentFieldError = ({ field, id, label, message }) => {
  const { invalidField } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  if (invalidField !== field) return null;

  return (
    <FormHelperText
      id={id}
      error
      role="alert"
      sx={{ m: 0, mt: 0.5, typography: 'body2' }}>
      {message
        ? formatMessage({ id: message })
        : formatMessage(
            { id: 'documentForm.checkField' },
            { field: formatMessage({ id: label }) }
          )}
    </FormHelperText>
  );
};

DocumentFieldError.propTypes = {
  field: PropTypes.string.isRequired,
  id: PropTypes.string,
  label: PropTypes.string,
  message: PropTypes.string
};

export default DocumentFieldError;
