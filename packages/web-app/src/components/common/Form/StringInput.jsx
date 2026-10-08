import { useId } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  FilledInput,
  FormControl,
  InputLabel,
  Typography
} from '@mui/material';

const StringInput = ({
  characterLimit,
  endAdornment,
  fullWidth = true,
  hasError = false,
  helperText,
  multiline = false,
  maxLength,
  onValueChange,
  required = false,
  type = 'text',
  value,
  valueName,
  ...props
}) => {
  const inputId = useId();
  const { formatMessage } = useIntl();
  const limit = characterLimit ?? maxLength;
  const count = value.length;
  const isTooLong = limit !== undefined && count > limit;
  const isNearLimit =
    maxLength !== undefined && count >= Math.ceil(maxLength * 0.8);
  const describedBy =
    [
      helperText && `${inputId}-help`,
      (isTooLong || isNearLimit) && `${inputId}-limit`,
      characterLimit !== undefined && `${inputId}-count`
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const handleValueChange = event => {
    onValueChange(event.target.value);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: fullWidth ? '100%' : undefined
      }}>
      {helperText && (
        <Typography
          id={`${inputId}-help`}
          variant="caption"
          sx={{
            color: 'text.secondary'
          }}>
          {helperText}
        </Typography>
      )}
      <FormControl
        variant="filled"
        fullWidth={fullWidth}
        required={required}
        error={hasError || isTooLong}>
        <InputLabel htmlFor={inputId}>{valueName}</InputLabel>
        <FilledInput
          id={inputId}
          aria-describedby={describedBy}
          endAdornment={endAdornment}
          multiline={multiline}
          name={valueName}
          onChange={handleValueChange}
          required={required}
          type={type}
          value={value}
          error={hasError || isTooLong}
          inputProps={limit === undefined ? undefined : { maxLength: limit }}
          {...props}
        />
      </FormControl>
      {(isTooLong || isNearLimit) && (
        <Typography
          id={`${inputId}-limit`}
          role={isTooLong ? 'alert' : undefined}
          variant="caption"
          color={isTooLong ? 'error' : 'text.secondary'}>
          {formatMessage({ id: 'form.maxLength' }, { count, limit })}
        </Typography>
      )}
      {characterLimit !== undefined && (
        <Typography
          id={`${inputId}-count`}
          variant="caption"
          sx={{ alignSelf: 'flex-end' }}>
          {count} / {characterLimit}
        </Typography>
      )}
    </Box>
  );
};

StringInput.propTypes = {
  characterLimit: PropTypes.number,
  endAdornment: PropTypes.node,
  fullWidth: PropTypes.bool,
  hasError: PropTypes.bool,
  helperText: PropTypes.string,
  multiline: PropTypes.bool,
  maxLength: PropTypes.number,
  onValueChange: PropTypes.func,
  required: PropTypes.bool,
  type: PropTypes.oneOf(['text', 'email', 'password']),
  value: PropTypes.string.isRequired,
  valueName: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

export default StringInput;
