import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';

import { DocumentFormContext } from '../../../Provider';
import DocumentFormAutoComplete from '../../DocumentFormAutoComplete';
import { getDocuments } from '../../../../../../../actions/Document/GetDocuments';

import Translate from '../../../../../../common/Translate';

const Wrapper = styled(FormControl)`
  ${({ theme }) => `
    margin: ${theme.spacing(4)};`}
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
        value={isLoading ? -1 : (selectedDocument ?? -1)}
        onChange={event => updateSelectedDocument(event.target.value)}>
        <MenuItem key={-1} value={-1} disabled>
          {isLoading && <CircularProgress fontSize="small" />}
          <i>
            <Translate>
              {isLoading ? 'Loading...' : 'Select an authorization'}
            </Translate>
          </i>
        </MenuItem>
        {documents.map(document => (
          <MenuItem key={document.id} value={document}>
            {document.title}
          </MenuItem>
        ))}
      </Select>
    </Wrapper>
  );
};

DocumentAuthorizationSelect.propTypes = {
  label: PropTypes.string,
  selectedDocument: PropTypes.oneOf([PropTypes.string, PropTypes.number]),
  updateSelectedDocument: PropTypes.func.isRequired
};

const DocumentAuthorizationSelectAutoComplete = ({
  contextValueName,
  helperContent,
  helperContentIfValueIsForced,
  labelText,
  required = false,
  updateSelectedDocument
}) => {
  const { document } = useContext(DocumentFormContext);

  return (
    <DocumentFormAutoComplete
      autoCompleteSearch={
        <DocumentAuthorizationSelect
          label={labelText}
          selectedDocument={document[contextValueName]}
          updateSelectedDocument={updateSelectedDocument}
        />
      }
      contextValueName={contextValueName}
      getValueName={doc => {
        if (doc && doc.title) {
          return doc.title;
        }
        return '';
      }}
      hasError={false} // How to check for errors ?
      helperContent={helperContent}
      helperContentIfValueIsForced={helperContentIfValueIsForced}
      label={labelText}
      required={required}
      searchLabelText={labelText}
      resultEndAdornment={null}
      sideActionDisabled={false}
      sideActionIcon={null}
      onSideAction={null}
      isSideActionOpen={false}
    />
  );
};

DocumentAuthorizationSelectAutoComplete.propTypes = {
  contextValueName: PropTypes.string.isRequired,
  helperContent: PropTypes.node,
  helperContentIfValueIsForced: PropTypes.node,
  labelText: PropTypes.string.isRequired,
  required: PropTypes.bool,
  updateSelectedDocument: PropTypes.func.isRequired
};

export default DocumentAuthorizationSelectAutoComplete;
