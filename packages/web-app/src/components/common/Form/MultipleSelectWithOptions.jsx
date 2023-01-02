import React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { FormHelperText, TextField } from '@mui/material';

import Translate from '../Translate';

import { MultipleSelectWithOptionsTypes } from './types';

// ==========

/**
 * This Select needs preloaded options
 * and filter them accordingly to the user input.
 */
const MultipleSelectWithOptions = ({
  computeHasError,
  getOptionLabel,
  getOptionSelected,
  handleOnChange,
  helperText,
  labelName,
  noOptionsText,
  options,
  renderOption,
  required = false,
  value
}) => {
  const [inputValue, setInputValue] = React.useState('');

  const handleInputChange = (event, newValue, reason) => {
    switch (reason) {
      case 'reset':
      case 'clear':
        setInputValue('');
        break;

      case 'input':
        setInputValue(newValue);
        break;

      default:
        break;
    }
  };

  const hasError = computeHasError(value);

  return (
    <>
      <Autocomplete
        multiple
        value={value}
        id={labelName}
        options={options}
        onChange={handleOnChange}
        onInputChange={handleInputChange}
        inputValue={inputValue}
        getOptionLabel={getOptionLabel}
        renderOption={renderOption}
        isOptionEqualToValue={getOptionSelected}
        filterSelectedOptions
        noOptionsText={noOptionsText}
        required={required}
        renderInput={params => (
          <TextField
            {...params}
            variant="filled"
            label={<Translate>{labelName}</Translate>}
            required={required}
            error={hasError}
          />
        )}
      />
      {helperText && (
        <FormHelperText variant="filled" error={hasError}>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
    </>
  );
};

MultipleSelectWithOptions.propTypes = {
  ...MultipleSelectWithOptionsTypes
};

export default MultipleSelectWithOptions;
