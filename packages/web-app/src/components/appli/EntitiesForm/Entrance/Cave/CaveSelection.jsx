import { useIntl } from 'react-intl';
import {
  FormControl,
  InputAdornment,
  InputLabel,
  FormHelperText
} from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import React, { useEffect, useState } from 'react';
import { useController } from 'react-hook-form';
import { isNil, length } from 'ramda';
import PropTypes from 'prop-types';

import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../../../actions/Quicksearch';
import { useDebounce } from '../../../../../hooks';
import {
  StyledInput,
  StyledFormControl,
  InputWrapper
} from '../../../../common/Form/FormAutoComplete';
import { entityOptionForSelector } from '../../../../../helpers/Entity';
import AutoCompleteSearchComponent from '../../../../common/AutoCompleteSearch';
import Details from '../Details';

const resultEndAdornment = (
  <InputAdornment position="end">
    <img
      src="/images/entry.svg"
      alt="Document icon"
      style={{ width: '40px' }}
    />
  </InputAdornment>
);

const getCaveToString = cave => {
  return `${cave.name}`;
};

const CaveSelection = ({ control, errors }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState('');
  const debouncedInput = useDebounce(inputValue);
  const {
    field: { onChange: onIdChange, value: caveId },
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
  const {
    field: { onChange: onLengthChange }
  } = useController({
    control,
    name: 'length'
  });
  const {
    field: { onChange: onDepthChange }
  } = useController({
    control,
    name: 'depth'
  });
  const {
    field: { onChange: onIsDivingChange }
  } = useController({
    control,
    name: 'isDiving'
  });
  const {
    field: { onChange: onTemperatureChange }
  } = useController({
    control,
    name: 'temperature'
  });
  const { isLoading, results: suggestions } = useSelector(
    state => state.quicksearch
  );
  const handleSelection = selection => {
    if (selection?.id) {
      onLengthChange(Number(selection.length));
      onDepthChange(Number(selection.depth));
      onTemperatureChange(Number(selection.temperature));
      onIsDivingChange(Boolean(selection.isDiving));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {!!caveId && <Details control={control} errors={errors} isReadonly />}
    </>
  );
};

export default CaveSelection;

CaveSelection.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    caveName: PropTypes.string
  })
};
