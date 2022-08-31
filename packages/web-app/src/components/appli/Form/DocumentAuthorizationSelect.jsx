import {
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress
} from '@material-ui/core';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { getDocuments } from '../../../actions/Document/GetDocuments';

const Wrapper = styled(FormControl)`
  ${({ theme }) => `
    margin: ${theme.spacing(4)}px;`}
`;

const DocumentAuthorizationSelect = ({
  label,
  selectedDocument,
  updateSelectedDocument
}) => {
  const dispatch = useDispatch();
  const { data, isLoading, totalCount } = useSelector(state => state.documents);
  const documents = data.authorizationDocuments;

  useEffect(() => {
    const criteria = {
      isValidated: true,
      documentType: 'Authorization To Publish'
    };
    dispatch(getDocuments(criteria));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Select uses reference comparison to check which option has been taken.
  If there is a default value, then the reference will be different from the object created when the documents are retrieved.
  */
  useEffect(() => {
    if (totalCount > 0 && selectedDocument) {
      const selected = documents.find(doc => doc.id === selectedDocument.id);
      if (selected) {
        updateSelectedDocument(selected);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <Wrapper variant="filled">
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={selectedDocument}
        onChange={event => updateSelectedDocument(event.target.value)}>
        {documents.map(document => (
          <MenuItem key={document.id} value={document}>
            {document.titles[0].text}
          </MenuItem>
        ))}
      </Select>
      {isLoading && <CircularProgress color="primary" />}
    </Wrapper>
  );
};

DocumentAuthorizationSelect.propTypes = {
  label: PropTypes.string,
  selectedDocument: PropTypes.oneOf([PropTypes.string, PropTypes.number]),
  updateSelectedDocument: PropTypes.func.isRequired
};

export default DocumentAuthorizationSelect;
