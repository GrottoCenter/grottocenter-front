import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import AutoCompleteSearch from '../common/AutoCompleteSearch';
import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../actions/Quicksearch';
import { useDebounce } from '../../hooks';
import {
  AUTOCOMPLETE_DEBOUNCE_DELAY,
  AUTOCOMPLETE_MIN_CHARACTERS
} from '../../conf/config';

const QuickSearch = ({ hasFixWidth, onClose }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { results, errors, isLoading } = useSelector(
    state => state.quicksearch
  );
  const [input, setInput] = useState('');

  const debouncedInput = useDebounce(input, AUTOCOMPLETE_DEBOUNCE_DELAY);

  const handleSelection = selection => {
    if (!selection.id) return;

    const id = encodeURIComponent(selection.id);
    const { _type } = selection;
    if (_type === 'entrances') navigate(`/ui/entrances/${id}`);
    else if (_type === 'caves') navigate(`/ui/caves/${id}`);
    else if (_type === 'persons') navigate(`/ui/persons/${id}`);
    else if (_type === 'documents') navigate(`/ui/documents/${id}`);
    else if (_type === 'organizations') navigate(`/ui/organizations/${id}`);
    else if (_type === 'massifs') navigate(`/ui/massifs/${id}`);

    setInput('');
    // Defer both blur and close so MUI Autocomplete's own focus-restore cycle
    // runs first — otherwise the keyboard re-opens on mobile immediately after.
    setTimeout(() => {
      document.activeElement?.blur();
      onClose?.();
    }, 0);
  };

  useEffect(() => {
    if (debouncedInput.length < AUTOCOMPLETE_MIN_CHARACTERS) {
      dispatch(resetQuicksearch());
      return;
    }
    const criterias = {
      query: debouncedInput.trim(),
      entities: ['entrances', 'documents', 'organizations', 'massifs']
    };

    dispatch(fetchQuicksearchResult(criterias));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  return (
    <AutoCompleteSearch
      onInputChange={setInput}
      inputValue={input}
      label={formatMessage({ id: 'Quick search' })}
      suggestions={results}
      onSelection={handleSelection}
      hasError={!!errors}
      isLoading={isLoading}
      hasFixWidth={hasFixWidth}
    />
  );
};

export default QuickSearch;

QuickSearch.propTypes = {
  hasFixWidth: PropTypes.bool,
  onClose: PropTypes.func
};
