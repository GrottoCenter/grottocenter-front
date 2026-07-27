import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';

import Autocomplete from '@mui/material/Autocomplete';
import { TextField, Typography } from '@mui/material';
import { DocumentFormContext } from '../Provider';

import Translate from '../../../../common/Translate';
import { MultipleSelectWithOptionsTypes } from '../../../../common/Form/types';

const CHIP_SLOT_PROPS = { chip: { color: 'primary' } };

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
      {helperText && (
        <Typography variant="caption" color={hasError ? 'error' : 'text.secondary'} display="block">
          <Translate>{helperText}</Translate>
        </Typography>
      )}
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
        slotProps={CHIP_SLOT_PROPS}
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
