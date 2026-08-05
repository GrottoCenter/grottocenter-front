import PropTypes from 'prop-types';
import {
  Box,
  FilledInput,
  FormControl,
  InputLabel,
  Typography
} from '@mui/material';

const StringInput = ({
  endAdornment,
  fullWidth = true,
  hasError = false,
  helperText,
  multiline = false,
  onValueChange,
  required = false,
  type = 'text',
  value,
  valueName,
  ...props
}) => {
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
        <Typography variant="caption" color="text.secondary">
          {helperText}
        </Typography>
      )}
      <FormControl
        variant="filled"
        fullWidth={fullWidth}
        required={required}
        error={hasError}>
        <InputLabel>{valueName}</InputLabel>
        <FilledInput
          endAdornment={endAdornment}
          multiline={multiline}
          name={valueName}
          onChange={handleValueChange}
          required={required}
          type={type}
          value={value}
          error={hasError}
          {...props}
        />
      </FormControl>
    </Box>
  );
};

StringInput.propTypes = {
  endAdornment: PropTypes.node,
  fullWidth: PropTypes.bool,
  hasError: PropTypes.bool,
  helperText: PropTypes.string,
  multiline: PropTypes.bool,
  onValueChange: PropTypes.func,
  required: PropTypes.bool,
  type: PropTypes.oneOf(['text', 'email', 'password']),
  value: PropTypes.string.isRequired,
  valueName: PropTypes.string.isRequired,
  disabled: PropTypes.bool
};

export default StringInput;
