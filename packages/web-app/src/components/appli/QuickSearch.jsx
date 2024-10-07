import React, { useEffect } from 'react';
import { isNil, length } from 'ramda';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import AutoCompleteSearch from '../common/AutoCompleteSearch';
import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../actions/Quicksearch';
import { entityOptionForSelector } from '../../helpers/Entity';
import { useDebounce } from '../../hooks';

export const searchableTypes = {
  cavers: 'cavers',
  documents: 'documents',
  entries: 'entries',
  massifs: 'massifs',
  organizations: 'grottos'
};

const getOptionLabel = option => option.name;

const QuickSearch = ({
  searchOnTypes = [
    'documents',
    'entrances',
    'grottos',
    'massifs'
    // 'caves',     Cave search is suspended for the moment because they seems to be duplicates of entrances
    // 'networks'   No network search because there is no network page currently
  ],
  searchOnType,
  label,
  inputProps,
  error,
  ...autoCompleteProps
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { results, errors, isLoading } = useSelector(
    state => state.quicksearch
  );
  const [input, setInput] = React.useState('');

  const debouncedInput = useDebounce(input);

  const handleSelection = selection => {
    if (selection.id) {
      if (autoCompleteProps.onSelection) {
        autoCompleteProps.onSelection(selection);
      } else {
        switch (selection.type) {
          case 'entrance':
            navigate(`/ui/entrances/${encodeURIComponent(selection.id)}`);
            break;
          case 'cave':
            navigate(`/ui/caves/${encodeURIComponent(selection.id)}`);
            break;
          case 'caver':
            navigate(`/ui/persons/${encodeURIComponent(selection.id)}`);
            break;
          case 'document':
            navigate(`/ui/documents/${encodeURIComponent(selection.id)}`);
            break;
          case 'grotto':
            navigate(`/ui/organizations/${encodeURIComponent(selection.id)}`);
            break;
          case 'massif':
            navigate(`/ui/massifs/${encodeURIComponent(selection.id)}`);
            break;
          case 'network':
            navigate(`/ui/networks/${encodeURIComponent(selection.id)}`);
            break;
          default:
        }
      }
    }
    setInput('');
  };

  useEffect(() => {
    if (length(debouncedInput) > 2) {
      const criterias = {
        query: debouncedInput.trim(),
        complete: false
      };
      if (searchOnType) criterias.resourceType = searchOnType;
      else if (searchOnTypes.length !== 0)
        criterias.resourceTypes = searchOnTypes;
      dispatch(fetchQuicksearchResult(criterias));
    } else {
      dispatch(resetQuicksearch());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput]);

  return (
    <AutoCompleteSearch
      onInputChange={setInput}
      inputValue={input}
      label={label || formatMessage({ id: 'Quick search' })}
      suggestions={results}
      onSelection={handleSelection}
      renderOption={entityOptionForSelector}
      getOptionLabel={getOptionLabel}
      hasError={!isNil(errors) || error}
      isLoading={isLoading}
      {...autoCompleteProps}
    />
  );
};

export default QuickSearch;

QuickSearch.propTypes = {
  hasFixWidth: PropTypes.bool,
  label: PropTypes.string,
  searchOnTypes: PropTypes.arrayOf(
    PropTypes.oneOf([
      'documents',
      'entrances',
      'grottos',
      'languages',
      'massifs',
      'caves',
      'networks'
    ])
  ),
  searchOnType: PropTypes.oneOf([
    'documents',
    'entrances',
    'grottos',
    'languages',
    'massifs',
    'caves',
    'networks'
  ]),
  inputProps: PropTypes.string,
  error: PropTypes.bool
};
