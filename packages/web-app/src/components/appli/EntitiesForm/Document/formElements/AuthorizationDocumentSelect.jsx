import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Autocomplete, CircularProgress, TextField } from '@mui/material';

import { useDocuments } from '@/hooks';

const AuthorizationDocumentSelect = ({
  value,
  onChange,
  disabled = false,
  required = true,
  disableClearable = false
}) => {
  const { formatMessage } = useIntl();
  const { data, isLoading } = useDocuments({
    isValidated: true,
    documentType: 'Authorization To Publish'
  });

  return (
    <Autocomplete
      disabled={disabled}
      disableClearable={disableClearable}
      loading={isLoading}
      options={data?.documents ?? []}
      getOptionLabel={doc => doc.title ?? ''}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      value={value ?? null}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={params => (
        <TextField
          {...params}
          variant="filled"
          required={required && !disabled}
          label={formatMessage({ id: 'Authorization from authors' })}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              endAdornment: (
                <>
                  {isLoading && <CircularProgress size={16} />}
                  {params.slotProps.input.endAdornment}
                </>
              )
            }
          }}
        />
      )}
    />
  );
};

AuthorizationDocumentSelect.propTypes = {
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  disableClearable: PropTypes.bool,
  value: PropTypes.shape({ id: PropTypes.number, title: PropTypes.string }),
  onChange: PropTypes.func.isRequired
};

export default AuthorizationDocumentSelect;
