import React, { useContext, useMemo } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Tooltip
} from '@material-ui/core';

import Translate from '../../../../common/Translate';
import useDocumentTypes from '../../../../../hooks/useDocumentTypes';
import { DocumentFormContext } from '../Provider';

const FIRST_DOCUMENT_TYPES_TO_DISPLAY = ['Article', 'Collection', 'Issue'];

const DocumentTypeSelect = ({
  allDocumentTypes,
  helperText,
  required = false
}) => {
  const {
    docAttributes: { documentType },
    updateAttribute
  } = useContext(DocumentFormContext);
  const { isUnknown } = useDocumentTypes();
  const { formatMessage } = useIntl();
  const handleChange = (event, child) => {
    const newDocType = {
      id: event.target.value,
      name: child.props.name
    };
    updateAttribute('documentType', newDocType);
  };

  const firstDocumentTypes = allDocumentTypes
    .filter(dt => FIRST_DOCUMENT_TYPES_TO_DISPLAY.includes(dt.name))
    .sort((dt1, dt2) => dt1.name > dt2.name);
  const otherDocumentTypes = allDocumentTypes
    .filter(dt => !FIRST_DOCUMENT_TYPES_TO_DISPLAY.includes(dt.name))
    .sort((dt1, dt2) => dt1.name > dt2.name);
  const sortedDocumentTypes = [...firstDocumentTypes, ...otherDocumentTypes];

  const memoizedValues = [allDocumentTypes, documentType];
  return useMemo(
    () => (
      <FormControl variant="filled" required={required} fullWidth>
        <InputLabel htmlFor="document-type">
          <Translate>Document type</Translate>
        </InputLabel>
        <Select
          defaultValue={-1}
          value={isUnknown(documentType) ? -1 : documentType.id}
          onChange={handleChange}
          inputProps={{
            id: `document-type`,
            name: `document-type`
          }}>
          <MenuItem key={-1} value={-1} name="Undefined" disabled>
            <i>
              <Translate>Select a document type</Translate>
            </i>
          </MenuItem>
          {sortedDocumentTypes.map(dt => (
            <Tooltip
              key={dt.id}
              name={dt.name}
              value={dt.id}
              title={dt.comment}
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
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    memoizedValues
  );
};

DocumentType.propTypes = {
  id: PropTypes.number.isRequired,
  comment: PropTypes.string,
  name: PropTypes.string.isRequired
};

DocumentTypeSelect.propTypes = {
  allDocumentTypes: PropTypes.arrayOf(PropTypes.shape(DocumentType.propTypes))
    .isRequired,
  helperText: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default DocumentTypeSelect;
