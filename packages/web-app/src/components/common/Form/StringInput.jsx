import { useId } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  FilledInput,
  FormControl,
  FormHelperText,
  InputLabel,
  Typography
} from '@mui/material';
import { isNearLengthLimit } from '@/utils/textLengthLimits';
import FieldHelperText from './FieldHelperText';

const StringInput = ({
  characterLimit,
  endAdornment,
  errorText,
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
  const inputValue = value ?? '';
  const count = inputValue.length;
  const isTooLong = limit !== undefined && count > limit;
  const isNearLimit = isNearLengthLimit(count, maxLength);
  const shouldShowCounter = characterLimit !== undefined || isNearLimit;
  const describedBy =
    [
      helperText && `${inputId}-help`,
      errorText && `${inputId}-error`,
      isTooLong && `${inputId}-limit`,
      shouldShowCounter && `${inputId}-count`
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
        <FieldHelperText id={`${inputId}-help`}>{helperText}</FieldHelperText>
      )}
      <FormControl
        variant="filled"
        fullWidth={fullWidth}
        required={required}
        error={hasError || !!errorText || isTooLong}>
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
          value={inputValue}
          error={hasError || !!errorText || isTooLong}
          inputProps={limit === undefined ? undefined : { maxLength: limit }}
          {...props}
        />
      </FormControl>
      {errorText && (
        <FormHelperText
          id={`${inputId}-error`}
          error
          role="alert"
          sx={{ typography: 'body2' }}>
          {errorText}
        </FormHelperText>
      )}
      {isTooLong && (
        <Typography
          id={`${inputId}-limit`}
          role="alert"
          variant="caption"
          color="error"
          sx={{ textAlign: 'right' }}>
          {formatMessage({ id: 'form.maxLength' }, { count, limit })}
        </Typography>
      )}
      {shouldShowCounter && (
        <Typography
          id={`${inputId}-count`}
          variant="caption"
          sx={{
            alignSelf: 'flex-end',
            color: isTooLong ? 'error.main' : 'text.secondary'
          }}>
          {count} / {limit}
        </Typography>
      )}
    </Box>
  );
};

StringInput.propTypes = {
  characterLimit: PropTypes.number,
  errorText: PropTypes.node,
  endAdornment: PropTypes.node,
  fullWidth: PropTypes.bool,
  hasError: PropTypes.bool,
  helperText: PropTypes.string,
  multiline: PropTypes.bool,
  maxLength: PropTypes.number,
  onValueChange: PropTypes.func,
  required: PropTypes.bool,
  type: PropTypes.oneOf(['text', 'email', 'password']),
  value: PropTypes.string,
  valueName: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

export default StringInput;
