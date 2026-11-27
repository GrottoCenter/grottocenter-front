import { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

import { useLicenses, findLicenseByName } from '@/hooks';
import { getLicenseName } from '@/components/common/LicenseTag/helpers';
import { DocumentFormContext } from '../Provider';
import AuthorizationDocumentSelect from './AuthorizationDocumentSelect';
import DocumentLicenseSelect from './DocumentLicenseSelect';

const CollectionPublicationRights = ({ disabled = false }) => {
  const { document, hasStoredAuthorization, updateAttribute } =
    useContext(DocumentFormContext);
  const { data: licenses, isLoading } = useLicenses();
  const licenseName = getLicenseName(document.license);
  const licenseId = document.license?.id;
  const hasAuthorization = !!document.authorizationDocument?.id;
  const resolvedLicense = findLicenseByName(licenses, licenseName);

  useEffect(() => {
    if (resolvedLicense && resolvedLicense.id !== licenseId)
      updateAttribute('license', resolvedLicense);
  }, [resolvedLicense, licenseId, updateAttribute]);

  return (
    <Box data-testid="collection-publication-rights" sx={{ mb: 2 }}>
      <AuthorizationDocumentSelect
        value={document.authorizationDocument}
        onChange={value => updateAttribute('authorizationDocument', value)}
        required={hasStoredAuthorization}
        disableClearable={hasStoredAuthorization}
        disabled={disabled}
      />
      {hasAuthorization && (
        <DocumentLicenseSelect
          value={document.license}
          onChange={value => updateAttribute('license', value)}
          licenses={licenses}
          isLoading={isLoading}
          hasUnknownLicense={!!licenses && !!licenseName && !resolvedLicense}
          disabled={disabled}
        />
      )}
    </Box>
  );
};

CollectionPublicationRights.propTypes = { disabled: PropTypes.bool };

export default CollectionPublicationRights;
