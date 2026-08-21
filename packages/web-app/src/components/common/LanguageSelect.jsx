import PropTypes from 'prop-types';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import Translate from './Translate';
import { useLanguages } from '../../hooks';

const LanguageSelect = ({
  value,
  onChange,
  label,
  required = false,
  disabled = false,
  error = false
}) => {
  const { data: languages = [], isSuccess: isLoaded } = useLanguages();

  return (
    <FormControl variant="standard" fullWidth required={required} error={error}>
      <InputLabel shrink>{label ?? <Translate>Language</Translate>}</InputLabel>
      <Select
        value={isLoaded ? (value ?? '000') : '000'}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}>
        <MenuItem value="000" disabled>
          <i>
            <Translate>
              {isLoaded ? 'Select a language' : 'Loading...'}
            </Translate>
          </i>
        </MenuItem>
        {languages.map(l => (
          <MenuItem key={l.id} value={l.id}>
            <Translate>{l.refName}</Translate>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

LanguageSelect.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.bool
};

export default LanguageSelect;
