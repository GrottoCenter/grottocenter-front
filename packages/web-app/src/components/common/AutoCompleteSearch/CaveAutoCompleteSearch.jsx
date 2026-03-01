import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { FormControl, InputAdornment, InputLabel } from '@mui/material';

import {
  StyledInput,
  StyledFormControl,
  InputWrapper
} from '../Form/FormAutoComplete';
import AutoCompleteSearch from '.';
import { fetchQuickSearchRaw } from '../../../actions/Quicksearch';
import { useDebounce } from '../../../hooks';
import { networkIcon } from '../../../assets/icons';

const getCaveToString = cave => {
  let out = [cave?.name];
  if (cave?.depth) out.push(`↕ ${cave?.depth}m`);
  if (cave?.length) out.push(`↔ ${cave?.length}m`);
  out = out.filter(e => e);
  return out.join(' ');
};

const resultEndAdornment = (
  <InputAdornment position="end">
    <img src={networkIcon} alt="Document icon" width={40} height={40} />
  </InputAdornment>
);

const CaveAutoCompleteSearch = ({
  onSelection,
  value,
  required = false,
  disabled = false
}) => {
  const { formatMessage } = useIntl();
  const [input, setInput] = useState('');
  const [selected, setSelected] = useState(value);
  const debouncedInput = useDebounce(input);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!debouncedInput || debouncedInput.length < 2) {
        setSuggestions([]);
        return;
      }
      const criterias = {
        query: debouncedInput.trim(),
        entities: ['caves']
      };
      setIsLoading(true);
      const rep = await fetchQuickSearchRaw(criterias).catch(e =>
        setError(e.message)
      );
      setIsLoading(false);
      setSuggestions(rep.results);
    }
    fetchData();
  }, [debouncedInput]);

  const handleSelection = selection => {
    if (selection) {
      onSelection(selection);
      setSelected(selection);
    }
    setInput('');
  };
  return (
    <FormControl variant="filled" required={required} error={!!error} fullWidth>
      <InputLabel>{formatMessage({ id: 'Cave' })}</InputLabel>
      <StyledInput
        value={getCaveToString(selected)}
        disabled
        endAdornment={resultEndAdornment}
      />
      <StyledFormControl variant="filled" error={!!error}>
        <InputWrapper>
          <AutoCompleteSearch
            onInputChange={setInput}
            inputValue={input}
            disabled={disabled}
            onSelection={handleSelection}
            hasError={!!error}
            isLoading={isLoading}
            label={formatMessage({ id: 'Search for a cave' })}
            suggestions={suggestions}
          />
        </InputWrapper>
      </StyledFormControl>
    </FormControl>
  );
};

CaveAutoCompleteSearch.propTypes = {
  disabled: PropTypes.bool,
  onSelection: PropTypes.func.isRequired,
  required: PropTypes.bool,
  value: PropTypes.shape({
    name: PropTypes.string
  })
};
export default CaveAutoCompleteSearch;
