import { useContext } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

import { DocumentFormContext } from '../Provider';
import AuthorizationDocumentSelect from './AuthorizationDocumentSelect';
import AuthorizationGrantedLicense from './AuthorizationGrantedLicense';

const CollectionPublicationRights = ({ disabled = false }) => {
  const { document, hasStoredAuthorization, updateAttribute } =
    useContext(DocumentFormContext);
  const hasAuthorization = !!document.authorizationDocument?.id;

  return (
    <Box
      data-testid="collection-publication-rights"
      sx={{ display: 'grid', gap: 1 }}>
      <AuthorizationDocumentSelect
        value={document.authorizationDocument}
        onChange={value => updateAttribute('authorizationDocument', value)}
        required={hasStoredAuthorization}
        disableClearable={hasStoredAuthorization}
        disabled={disabled}
      />
      {hasAuthorization && <AuthorizationGrantedLicense />}
    </Box>
  );
};

CollectionPublicationRights.propTypes = { disabled: PropTypes.bool };

export default CollectionPublicationRights;
