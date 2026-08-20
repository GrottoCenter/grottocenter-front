import React, { useContext, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';

import {
  useDebounce,
  useLanguages,
  useLicenses,
  findLicenseByName
} from '../../../../../hooks';
import { getDocumentDetailsUrl } from '../../../../../conf/apiRoutes';
import { apiGet } from '../../../../../api/client';
import { documentKeys } from '../../../../../api/queryKeys';
import { STALE } from '../../../../../conf/queryClient';
import AutoCompleteSearchComponent from '../../../../common/AutoCompleteSearch';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from './AddFileForm/FileHelpers';

// Fetch a document detail on demand while reusing the useDocument cache.
// The old code used two dedicated slices (parentDocument, authorizationDocument)
// hitting the same /documents/:id endpoint as useDocument, with three copies
// of the same fetch machinery. fetchQuery reads from cache first, falls back
// to network, and populates the same key — so a parent document already open
// in DocumentDetails is served from memory here.
const fetchDocumentDetailFromCache = (queryClient, id) =>
  queryClient.fetchQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => apiGet(`${getDocumentDetailsUrl}${id}`),
    staleTime: STALE.STANDARD
  });

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
  const queryClient = useQueryClient();
  const { data: languages = [] } = useLanguages();
  const { data: licenses } = useLicenses();

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

  const getLanguageRefName = useCallback(
    languageId => {
      const language = languages.find(lang => lang.id === languageId);
      return language ? language.refName : languageId;
    },
    [languages]
  );

  const getLicenseByName = useCallback(
    licenseName => findLicenseByName(licenses, licenseName) ?? null,
    [licenses]
  );

  const handleSelection = async newValue => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (newValue !== null) {
      updateAttribute(contextValueName, newValue);
      if (contextValueName === 'parent') {
        try {
          const documentDetails = await fetchDocumentDetailFromCache(
            queryClient,
            newValue.id
          );

          if (
            documentDetails.mainLanguage &&
            typeof documentDetails.mainLanguage === 'string'
          ) {
            updateAttribute(
              'mainLanguage',
              documentDetails.mainLanguage || '000'
            );
            updateAttribute(
              'mainLanguageName',
              getLanguageRefName(documentDetails.mainLanguage)
            );
          }

          if (documentDetails.license) {
            let licenseObject = null;

            if (typeof documentDetails.license === 'string') {
              licenseObject = getLicenseByName(documentDetails.license);
            }
            updateAttribute('license', licenseObject);
          }

          updateAttribute('editor', documentDetails.editor ?? null);
          updateAttribute('library', documentDetails.library ?? null);
          updateAttribute(
            'selectOptionAuthorizationDocument',
            documentDetails.authorizationDocument
              ? DOCUMENT_AUTHORIZE_TO_PUBLISH
              : null
          );

          if (documentDetails.authorizationDocument) {
            const authDocumentDetails = await fetchDocumentDetailFromCache(
              queryClient,
              documentDetails.authorizationDocument.id
            );
            updateAttribute('authorizationDocument', authDocumentDetails);
          }
        } catch (error) {
          console.error('Error fetching parent document details:', error);
        }
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

SearchBar.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  fetchSearchResults: PropTypes.func.isRequired,
  getValueName: PropTypes.func.isRequired,
  resetSearchResults: PropTypes.func.isRequired,

  suggestions: PropTypes.arrayOf(PropTypes.shape({})).isRequired,

  renderOption: PropTypes.func.isRequired,
  getOptionLabel: PropTypes.func.isRequired,
  label: PropTypes.string,
  hasError: PropTypes.bool,
  isLoading: PropTypes.bool,

  inputValue: PropTypes.string
};

export default SearchBar;
