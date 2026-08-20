import React, { useContext, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';

import { DocumentFormContext } from '../Provider';

import { useDebounce, useLanguages, useLicenses } from '../../../../../hooks';
import AutoCompleteSearchComponent from '../../../../common/AutoCompleteSearch';
import {
  fetchParentDocumentDetails,
  FETCH_PARENT_DOCUMENT_DETAILS_SUCCESS
} from '../../../../../actions/Document/GetParentDocumentDetails';
import {
  fetchAuthorizationDocumentDetails,
  FETCH_AUTHORIZATION_DOCUMENT_DETAILS_SUCCESS
} from '../../../../../actions/Document/GetAuthorizationDocumentDetails';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from './AddFileForm/FileHelpers';

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
  const dispatch = useDispatch();
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
    licenseName => {
      if (!licenses || !licenseName) return null;
      return licenses.find(lic => lic.name === licenseName) || null;
    },
    [licenses]
  );

  const handleSelection = async newValue => {
    // Defensive programming because the selection is triggerred
    // when the input is emptied.
    if (newValue !== null) {
      updateAttribute(contextValueName, newValue);
      if (contextValueName === 'parent') {
        try {
          const resultAction = await dispatch(
            fetchParentDocumentDetails(newValue.id)
          );

          if (resultAction.type === FETCH_PARENT_DOCUMENT_DETAILS_SUCCESS) {
            const documentDetails = resultAction.data;

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
              const authResponse = await dispatch(
                fetchAuthorizationDocumentDetails(
                  documentDetails.authorizationDocument.id
                )
              );
              if (
                authResponse.type ===
                FETCH_AUTHORIZATION_DOCUMENT_DETAILS_SUCCESS
              ) {
                const authDocumentDetails = authResponse.data;
                updateAttribute('authorizationDocument', authDocumentDetails);
              }
            }
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
