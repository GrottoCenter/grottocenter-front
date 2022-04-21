import {
  FormControl,
  InputAdornment,
  InputLabel,
  FormHelperText
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useController } from 'react-hook-form';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { isNil, length } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import { entityOptionForSelector } from '../../../../helpers/Entity';
import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../../actions/Quicksearch';
import AutoCompleteSearchComponent from '../../../common/AutoCompleteSearch';
import {
  StyledInput,
  StyledFormControl,
  InputWrapper
} from '../../../common/Form/FormAutoComplete';
import { useDebounce } from '../../../../hooks';

const resultEndAdornment = (
  <InputAdornment position="end">
    <img
      src="/images/entry.svg"
      alt="Document icon"
      style={{ width: '40px' }}
    />
  </InputAdornment>
);

const getCaveToString = massif => {
  return `${massif.name}`;
};

const CaveSelection = ({ control, errors }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue);
  const {
    field: { onChange: onIdChange },
    fieldState: { error }
  } = useController({
    control,
    name: 'caveId',
    rules: { required: true }
  });
  const {
    field: { onChange: onNameChange, value: caveNameValue }
  } = useController({
    control,
    name: 'caveName',
    rules: { required: true }
  });
  const { isLoading, results: suggestions } = useSelector(
    state => state.quicksearch
  );
  const handleSelection = selection => {
    if (selection?.id) {
      onIdChange(Number(selection.id));
      onNameChange(selection.name);
    } else {
      onIdChange(null);
    }
    setInputValue('');
  };

  const fetchSearchResults = query => {
    const criterias = {
      query: query.trim(),
      complete: false,
      resourceType: 'caves'
    };
    dispatch(fetchQuicksearchResult(criterias));
  };

  const resetSearchResults = () => {
    dispatch(resetQuicksearch());
  };

  useEffect(() => {
    if (length(debouncedInput) > 2) {
      fetchSearchResults(debouncedInput);
    } else {
      resetSearchResults();
    }
  }, [debouncedInput]);

  return (
    <>
      <FormControl
        variant="filled"
        required
        error={!!errors.caveName}
        fullWidth>
        <InputLabel>{formatMessage({ id: 'Cave' })}</InputLabel>
        <StyledInput
          value={caveNameValue}
          disabled
          endAdornment={resultEndAdornment}
        />
        <StyledFormControl variant="filled" error={!errors.caveName}>
          <InputWrapper>
            <AutoCompleteSearchComponent
              onInputChange={setInputValue}
              onSelection={handleSelection}
              getOptionLabel={getCaveToString}
              hasError={!isNil(error)}
              isLoading={isLoading}
              label={formatMessage({ id: 'Search a cave' })}
              renderOption={entityOptionForSelector}
              inputValue={inputValue}
              suggestions={suggestions}
            />
          </InputWrapper>
        </StyledFormControl>
        <FormHelperText>
          {formatMessage({
            id: 'An entrance must be attached to an existing cave'
          })}
        </FormHelperText>
      </FormControl>
    </>
  );
};

CaveSelection.propTypes = {
  control: PropTypes.objectOf(),
  errors: PropTypes.objectOf()
};

export default CaveSelection;
