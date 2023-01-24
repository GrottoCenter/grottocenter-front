import React from 'react';
import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import { useIntl } from 'react-intl';
import { TextField } from '@material-ui/core';

const InputText = ({
  control,
  formKey,
  labelName,
  validatorFn,
  onChangeAdditionalFn,
  isError,
  type = 'text',
  helperText,
  minRows,
  isRequired = false,
  isDisabled = false
}) => {
  const { formatMessage } = useIntl();
  return (
    <Controller
      name={formKey}
      control={control}
      rules={{
        required: isRequired,
        validate: value =>
          validatorFn ? validatorFn(value, formatMessage) : undefined
      }}
      render={({ field: { ref, value, onChange } }) => (
        <TextField
          fullWidth
          label={formatMessage({ id: labelName })}
          type={type}
          error={isError}
          required={isRequired}
          helperText={helperText}
          disabled={isDisabled ? true : undefined}
          multiline={minRows ? true : undefined}
          minRows={minRows || undefined}
          inputRef={ref}
          value={value}
          onChange={e => {
            onChange(e);
            if (onChangeAdditionalFn) onChangeAdditionalFn(e);
          }}
        />
      )}
    />
  );
};

InputText.propTypes = {
  control: PropTypes.shape({}).isRequired,
  formKey: PropTypes.string.isRequired,
  labelName: PropTypes.string.isRequired,
  isError: PropTypes.bool.isRequired,
  validatorFn: PropTypes.func,
  onChangeAdditionalFn: PropTypes.func,
  type: PropTypes.string,
  helperText: PropTypes.string,
  minRows: PropTypes.number,
  isRequired: PropTypes.bool,
  isDisabled: PropTypes.bool
};

export default InputText;
