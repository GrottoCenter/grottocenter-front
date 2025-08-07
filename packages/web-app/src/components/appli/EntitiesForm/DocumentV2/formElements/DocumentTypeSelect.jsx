import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Tooltip
} from '@mui/material';

import Translate from '../../../../common/Translate';
import { useDocumentTypes } from '../../../../../hooks';
import { DocumentFormContext } from '../Provider';
import { idNameTypeExtended } from '../../../../../types/idName.type';

import { loadDocumentTypes } from '../../../../../actions/DocumentType';

const DocumentTypeSelect = ({ helperText }) => {
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const { isArticle, isIssue } = useDocumentTypes();
  const { formatMessage } = useIntl();

  const dispatch = useDispatch();
  const { isLoaded, documentTypes } = useSelector(state => state.documentType);
  useEffect(() => {
    if (!isLoaded) {
      dispatch(loadDocumentTypes());
    }
  }, [dispatch, isLoaded]);

  const handleChange = event => {
    const newDocType = event.target.value;
    // Delete issue attribute when changing from "Issue" type
    if (!isIssue(newDocType)) updateAttribute('issue', null);

    // Delete pages attributes when changing from Article
    if (!isArticle(newDocType)) updateAttribute('pages', null);

    updateAttribute('type', newDocType);
  };

  return (
    <FormControl variant="outlined" fullWidth required>
      <InputLabel shrink htmlFor="document-type" id="document-type-label">
        <Translate>Document type</Translate>
      </InputLabel>
      <Select
        defaultValue={-1}
        value={document.type}
        onChange={handleChange}
        labelId="document-type-label"
        label={<Translate>Document type</Translate>}
        id="document-type">
        <MenuItem key={-1} value={-1} name="Undefined" disabled>
          <i>
            <Translate>Select a document type</Translate>
          </i>
        </MenuItem>
        {documentTypes.map(dt => (
          <Tooltip
            key={dt.id}
            name={dt.name}
            value={dt.name}
            title={formatMessage({ id: dt.comment })}
            aria-label={dt.comment}>
            <MenuItem>{formatMessage({ id: dt.name })}</MenuItem>
          </Tooltip>
        ))}
      </Select>
      {helperText && (
        <FormHelperText>
          <Translate>{helperText}</Translate>
        </FormHelperText>
      )}
    </FormControl>
  );
};

DocumentType.propTypes = idNameTypeExtended({
  comment: PropTypes.string
});

DocumentTypeSelect.propTypes = {
  helperText: PropTypes.string.isRequired
};

export default DocumentTypeSelect;
