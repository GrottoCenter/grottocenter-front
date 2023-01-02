import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Box, Button } from '@mui/material';
import styled from 'styled-components';

import {
  fetchAdvancedsearchResults,
  resetAdvancedSearchResults
} from '../../../../actions/Advancedsearch';
import { loadDocumentTypes } from '../../../../actions/DocumentType';
import { loadSubjects } from '../../../../actions/Subject';
import { ADVANCED_SEARCH_TYPES } from '../../../../conf/config';
import DocumentSearch from '../../AdvancedSearch/DocumentSearch';
import SearchResults from '../../AdvancedSearch/SearchResults';
import SelectedDocumentsTable from './SelectedDocumentsTable';

const SpacedButton = styled(Button)`
  ${({ theme }) => `
  margin: 0 ${theme.spacing(1)};`}
`;

const SearchDocumentForm = ({ closeForm, onSubmit }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [selectedDocuments, setSelectedDocuments] = useState([]);

  const { documentTypes } = useSelector(state => state.documentType);
  const { subjects } = useSelector(state => state.subject);

  const startAdvancedsearch = (formValues, resourceType) => {
    dispatch(fetchAdvancedsearchResults(formValues, resourceType));
  };

  const resetAdvancedSearch = () => {
    dispatch(resetAdvancedSearchResults());
  };

  const getDocumentTypes = () => {
    dispatch(loadDocumentTypes());
  };

  const getSubjects = () => {
    dispatch(loadSubjects());
  };

  const resetForm = () => {
    resetAdvancedSearch();
    setSelectedDocuments([]);
  };

  const handleRowClick = docResult => {
    if (!selectedDocuments.includes(docResult)) {
      setSelectedDocuments(previousDocs => [...previousDocs, docResult]);
    } else {
      setSelectedDocuments(previousDocs =>
        previousDocs.filter(d => d !== docResult)
      );
    }
  };

  const unselectDocument = docId => {
    setSelectedDocuments(previousDocs =>
      previousDocs.filter(d => d.id !== docId)
    );
  };

  const handleOnSubmit = () => {
    onSubmit(selectedDocuments);
    resetForm();
  };

  return (
    <Box textAlign="center">
      <DocumentSearch
        startAdvancedsearch={startAdvancedsearch}
        resourceType={ADVANCED_SEARCH_TYPES.DOCUMENTS}
        resetResults={resetAdvancedSearch}
        getAllDocumentTypes={getDocumentTypes}
        allDocumentTypes={documentTypes}
        getAllSubjects={getSubjects}
        allSubjects={subjects}
      />

      <SearchResults
        onRowClick={handleRowClick}
        selectedIds={selectedDocuments.map(d => d.id)}
      />

      <br />

      <SelectedDocumentsTable
        documents={selectedDocuments}
        unselectDocument={unselectDocument}
      />

      <Box my={4}>
        {closeForm && (
          <SpacedButton onClick={closeForm}>
            {formatMessage({ id: 'Cancel' })}
          </SpacedButton>
        )}
        <SpacedButton onClick={resetForm}>
          {formatMessage({ id: 'Reset' })}
        </SpacedButton>
        <SpacedButton
          disabled={selectedDocuments.length === 0}
          color="primary"
          type="submit"
          onClick={handleOnSubmit}
          sx={{ mx: 1 }}>
          {formatMessage({ id: 'Associate' })}
        </SpacedButton>
      </Box>
    </Box>
  );
};

SearchDocumentForm.propTypes = {
  closeForm: PropTypes.func,
  onSubmit: PropTypes.func.isRequired
};

export default SearchDocumentForm;
