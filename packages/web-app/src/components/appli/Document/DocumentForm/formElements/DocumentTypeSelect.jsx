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

import { isUnknown } from '../DocumentTypesHelper';
import { DocumentFormContext } from '../Provider';

const DocumentTypeSelect = ({
  allDocumentTypes,
  helperText,
  required = false
}) => {
  const {
    docAttributes: { documentType },
    updateAttribute
  } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const handleChange = (event, child) => {
    const newDocType = {
      id: event.target.value,
      name: child.props.name
    };
    updateAttribute('documentType', newDocType);
  };

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
          {allDocumentTypes
            .sort((dt1, dt2) => dt1.id > dt2.id)
            .map(t => (
              <Tooltip
                name={t.name}
                value={t.id}
                key={t.id}
                title={t.comment}
                aria-label={t.comment}>
                <MenuItem>{formatMessage({ id: t.name })}</MenuItem>
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

DocumentTypeSelect.propTypes = {
  allDocumentTypes: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  helperText: PropTypes.string.isRequired,
  required: PropTypes.bool
};

export default DocumentTypeSelect;
