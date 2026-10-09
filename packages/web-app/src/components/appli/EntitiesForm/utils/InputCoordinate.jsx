import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { TextField } from '@mui/material';

// The InputCoordinate input accept coordinate with ',' or '.'
// But the api only accept notation with '.'
// So before submitting to the api, coordinates must be normalised
export function normelizeCoordinate(coordStr) {
  if (typeof coordStr !== 'string') return coordStr;
  return coordStr.replace(',', '.');
}

const InputCoordinate = ({
  field: { ref, value, onChange, onBlur, name },
  labelName,
  isError,
  helperText,
  isRequired = false
}) => {
  const { formatMessage } = useIntl();
  return (
    <TextField
      name={name}
      onBlur={onBlur}
      fullWidth
      required={isRequired}
      label={formatMessage({ id: labelName })}
      type="text"
      error={isError}
      inputRef={ref}
      helperText={helperText}
      value={value ?? ''}
      onChange={e => {
        const reg = /^-?\d*(\.|,)?(\d+)?$/;
        const oldV = value ?? '';
        const newV = e.target.value;
        const res = newV.match(reg) ? newV : oldV;
        return onChange(res);
      }}
    />
  );
};

InputCoordinate.propTypes = {
  field: PropTypes.shape({
    ref: PropTypes.func,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  labelName: PropTypes.string.isRequired,
  isError: PropTypes.bool.isRequired,
  isRequired: PropTypes.bool,
  helperText: PropTypes.string
};

export default InputCoordinate;
