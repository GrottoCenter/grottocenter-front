import { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { InputAdornment } from '@mui/material';
import { bibliographyIcon } from '../../../../../assets/icons';

import { DocumentFormContext } from '../Provider';

import { useQuickSearch } from '../../../../../hooks';
import { entityOptionForSelector } from '../../../../../helpers/Entity';

import {
  documentTypeHelpers,
  filterParentDocumentResults
} from '../../../../../utils/documentTypeHelpers';
import SearchBar from './SearchBar';

import FormAutoCompleteComponent from '../../../../common/Form/FormAutoComplete';

const resultEndAdornment = (
  <InputAdornment position="end">
    <img src={bibliographyIcon} alt="Document icon" style={{ width: '40px' }} />
  </InputAdornment>
);

const DOC_ENTITIES = ['documents'];

const DocumentAutoComplete = ({
  contextValueName,
  helperContent,
  labelText,
  required = false,
  searchLabelText
}) => {
  const { isArticle, isIssue } = documentTypeHelpers;
  const { document } = useContext(DocumentFormContext);
  const [searchQuery, setSearchQuery] = useState('');

  // The user must not search all the documents everytime:
  //   - if he creates an article, he's searching for an issue
  //   - if he creates an issue, he's searching for a collection
  //   - else he's searching for any document.
  const searchFilter = useMemo(() => {
    if (isArticle(document.type)) return { type: 'Issue' };
    if (isIssue(document.type)) return { type: 'Collection' };
    return {};
  }, [document.type, isArticle, isIssue]);

  const {
    data,
    error,
    isFetching: isLoading
  } = useQuickSearch({
    query: searchQuery,
    entities: DOC_ENTITIES,
    filter: searchFilter
  });
  const quicksearchResult = filterParentDocumentResults(
    data?.results ?? [],
    document.id
  );

  const getDocumentName = doc => `[${doc.type}] ${doc.title}`;

  const fetchSearchResults = debouncedInput => setSearchQuery(debouncedInput);
  const resetSearchResults = () => setSearchQuery('');

  return (
    <FormAutoCompleteComponent
      autoCompleteSearch={
        <SearchBar
          fetchSearchResults={fetchSearchResults}
          resetSearchResults={resetSearchResults}
          getOptionLabel={getDocumentName}
          getValueName={getDocumentName}
          hasError={!!error}
          isLoading={isLoading}
          label={searchLabelText}
          renderOption={entityOptionForSelector}
          suggestions={quicksearchResult}
          contextValueName={contextValueName}
        />
      }
      value={document[contextValueName]}
      getValueName={getDocumentName}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      label={labelText}
      required={required}
      resultEndAdornment={resultEndAdornment}
    />
  );
};

DocumentAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,

  searchLabelText: PropTypes.string.isRequired
};

export default DocumentAutoComplete;
