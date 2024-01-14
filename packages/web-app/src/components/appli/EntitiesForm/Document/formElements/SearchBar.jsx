import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';

import { useDebounce } from '../../../../../hooks';
import AutoCompleteSearchComponent from '../../../../common/AutoCompleteSearch';
import { AutoCompleteSearchTypes } from '../../../../common/AutoCompleteSearch/types';

const SearchBar = props => {
  const {
    contextValueName,
    fetchSearchResults,
    getValueName,
    resetSearchResults,
    inputValue: defaultInputValue = ''
  } = props;
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const [inputValue, setInputValue] = React.useState(defaultInputValue);
  const debouncedInput = useDebounce(inputValue);

  const handleInputChange = newValue => {
    if (
      document[contextValueName] &&
      getValueName(document[contextValueName]) === newValue
    ) {
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  const handleSelection = newValue => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (newValue !== null) {
      updateAttribute(contextValueName, newValue);

      if (contextValueName === 'parent') {
        updateAttribute('editor', newValue.editor ?? null);
        updateAttribute('library', newValue.library ?? null);
      }
    }
    setInputValue('');
  };

  useEffect(() => {
    setInputValue(defaultInputValue);
  }, [defaultInputValue]);

  useEffect(() => {
    if (debouncedInput.length > 2) {
      fetchSearchResults(debouncedInput);
    } else {
      resetSearchResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  return (
    <AutoCompleteSearchComponent
      disabled={/* isValueForced */ false} // Don't disable search component, event if it's forced. See https://github.com/GrottoCenter/grottocenter-front/issues/58
      // isValueForced={isValueForced}
      onInputChange={handleInputChange}
      onSelection={handleSelection}
      {...props}
      inputValue={inputValue}
    />
  );
};

const SearchBarInheritedProps = AutoCompleteSearchTypes;
delete SearchBarInheritedProps.disabled;
delete SearchBarInheritedProps.isValueForced;
delete SearchBarInheritedProps.onInputChange;
delete SearchBarInheritedProps.onSelection;

SearchBar.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  fetchSearchResults: PropTypes.func.isRequired,
  getValueName: PropTypes.func.isRequired,
  resetSearchResults: PropTypes.func.isRequired,
  ...SearchBarInheritedProps,
  inputValue: PropTypes.string
};

export default SearchBar;
