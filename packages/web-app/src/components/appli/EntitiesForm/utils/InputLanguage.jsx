import PropTypes from 'prop-types';
import { Controller } from 'react-hook-form';
import LanguageSelect from '../../../common/LanguageSelect';

const InputLanguage = ({ formKey, control, isError, isDisabled = false }) => (
  <Controller
    name={formKey}
    control={control}
    rules={{ required: true }}
    render={({ field: { value, onChange, onBlur, ref }, fieldState }) => (
      <LanguageSelect
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        inputRef={ref}
        helperText={fieldState.error ? 'Required' : undefined}
        required
        error={isError}
        disabled={isDisabled}
      />
    )}
  />
);

InputLanguage.propTypes = {
  formKey: PropTypes.string.isRequired,
  control: PropTypes.shape({}).isRequired,
  isError: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool
};

export default InputLanguage;
