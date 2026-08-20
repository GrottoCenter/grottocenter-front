import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import AutoCompleteSearch from '../common/AutoCompleteSearch';
import { useDebounce, useOnlineStatus, useQuickSearch } from '../../hooks';
import { AUTOCOMPLETE_DEBOUNCE_DELAY } from '../../conf/config';

const QUICKSEARCH_ENTITIES = ['entrances', 'caves', 'organizations', 'massifs'];

const QuickSearch = ({ hasFullWidthResults, autoFocus, onClose }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const [input, setInput] = useState('');

  const debouncedInput = useDebounce(input, AUTOCOMPLETE_DEBOUNCE_DELAY);
  const { data, error, isFetching } = useQuickSearch({
    query: debouncedInput,
    entities: QUICKSEARCH_ENTITIES,
    // Search runs on the API's index, which is never cached — offline every
    // keystroke would fail and paint the field red, as if the user had typed
    // something wrong. Skip the request and explain instead (see noOptionsText).
    enabled: isOnline
  });

  // A single-entrance cavity would appear twice (once as its cave, once as its
  // entrance). Keep only networks (caves with 2+ entrances) and all other entity
  // types (entrances, organizations, massifs) so the list never shows a cave
  // redundant with its entrance.
  const filteredResults = useMemo(
    () =>
      (data?.results ?? []).filter(
        ({ _type, nbEntrances }) => _type !== 'caves' || (nbEntrances ?? 0) > 1
      ),
    [data]
  );

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

  return (
    <AutoCompleteSearch
      onInputChange={setInput}
      inputValue={input}
      label={formatMessage({ id: 'Quick search' })}
      suggestions={filteredResults}
      onSelection={handleSelection}
      hasError={!!error}
      isLoading={isFetching}
      hasFullWidthResults={hasFullWidthResults}
      autoFocus={autoFocus}
      noOptionsText={
        isOnline ? undefined : formatMessage({ id: 'offlineSearchUnavailable' })
      }
    />
  );
};

export default QuickSearch;

QuickSearch.propTypes = {
  hasFullWidthResults: PropTypes.bool,
  autoFocus: PropTypes.bool,
  onClose: PropTypes.func
};
