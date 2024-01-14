import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { InputAdornment } from '@material-ui/core';

import { DocumentFormContext } from '../Provider';

import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../../../actions/Quicksearch';

import { entityOptionForSelector } from '../../../../../helpers/Entity';

import { useDocumentTypes } from '../../../../../hooks';
import SearchBar from './SearchBar';

import FormAutoCompleteComponent from '../../../../common/Form/FormAutoComplete';

const resultEndAdornment = (
  <InputAdornment position="end">
    <img
      src="/images/bibliography.svg"
      alt="Document icon"
      style={{ width: '40px' }}
    />
  </InputAdornment>
);

const DocumentAutoComplete = ({
  contextValueName,
  helperContent,
  labelText,
  required = false,
  searchLabelText
}) => {
  const dispatch = useDispatch();
  const {
    error,
    isLoading,
    results: quicksearchResult
  } = useSelector(state => state.quicksearch);
  const { isArticle, isIssue } = useDocumentTypes();

  const { document } = useContext(DocumentFormContext);

  // The user must not search all the documents everytime:
  //   - if he creates an article, he's searching for an issue
  //   - if he creates an issue, he's searching for a collection
  //   - else he's searching for any document.
  const docSearchedTypes = [];
  if (isArticle(document.type)) {
    docSearchedTypes.push('document-issues');
  } else if (isIssue(document.type)) {
    docSearchedTypes.push('document-collections');
  } else {
    docSearchedTypes.push('documents');
  }

  // /**
  //  * Recursive function to build the complete name of a "part" element
  //  * from all its parents and children.
  //  * @param part : element to build the name
  //  * @param childPart : previously child part name computed
  //  *
  //  * Ex:
  //  * If myArticle is from a Spelunca issue,
  //  * getPartOfName(myArticle, '') will return:
  //  * Spelunca [COLLECTION] > Spelunca n°142 > "the title of myArticle"
  //  */
  // const getPartOfName = (part, childPart = '') => {
  //   const conditionalChildPart = childPart === '' ? '' : `> ${childPart}`;

  //   // If the item is a Collection without child, display [COLLECTION] indicator
  //   const conditionalNamePart =
  //     isCollection(part.documentType) && childPart === ''
  //       ? `${part.name} [${formatMessage({ id: 'COLLECTION' })}]`
  //       : part.name;

  //   if (!part.partOf) {
  //     return `${conditionalNamePart} ${
  //       part.issue ? part.issue : ''
  //     } ${conditionalChildPart}`;
  //   }
  //   return getPartOfName(
  //     part.partOf,
  //     `${conditionalNamePart} ${part.issue} ${conditionalChildPart}`
  //   );
  // };

  const getDocumentName = doc => `[${doc.type}] ${doc.title}`;

  const fetchSearchResults = debouncedInput =>
    dispatch(
      fetchQuicksearchResult({
        query: debouncedInput.trim(),
        complete: false,
        resourceTypes: docSearchedTypes
      })
    );

  const resetSearchResults = () => dispatch(resetQuicksearch());

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
