import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import Autocomplete from '@mui/material/Autocomplete';
import { FormHelperText, TextField } from '@mui/material';
import { DocumentFormContext } from '../Provider';

import Translate from '../../../../common/Translate';
import { MultipleSelectWithOptionsTypes } from '../../../../common/Form/types';

const MultipleSelectWithOptions = ({
  computeHasError,
  getOptionLabel,
  getOptionSelected,
  helperText,
  labelName,
  noOptionsText,
  options,
  renderOption,
  required = false,
  contextValueName
}) => {
  const { document, updateAttribute } = useContext(DocumentFormContext);

  const [inputValue, setInputValue] = useState('');

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

  const handleOnChange = (event, newValue, reason) => {
    switch (reason) {
      case 'clear':
        updateAttribute(contextValueName, []);
        break;
      case 'selectOption':
      case 'removeOption':
        updateAttribute(contextValueName, newValue);
        break;
      default:
    }
  };

  const hasError = computeHasError(document[contextValueName]);

  return (
    <>
      <Autocomplete
        multiple
        value={document[contextValueName]}
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

const SelectInheritedProps = MultipleSelectWithOptionsTypes;
delete SelectInheritedProps.value;
delete SelectInheritedProps.handleOnChange;

MultipleSelectWithOptions.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  ...SelectInheritedProps
};

export default MultipleSelectWithOptions;
