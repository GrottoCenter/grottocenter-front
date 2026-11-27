import { useContext, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

import { useLicenses, findLicenseByName } from '@/hooks';
import { getLicenseName } from '@/components/common/LicenseTag/helpers';
import { DocumentFormContext } from '../Provider';
import { DOCUMENT_AUTHORIZE_TO_PUBLISH } from './AddFileForm/FileHelpers';
import AuthorizationDocumentSelect from './AuthorizationDocumentSelect';
import DocumentLicenseSelect from './DocumentLicenseSelect';

const CollectionPublicationRights = ({ disabled = false }) => {
  const { document, isNewDocument, updateAttribute } =
    useContext(DocumentFormContext);
  // The multipart API cannot clear a stored publication option.
  const hasStoredAuthorization = useRef(
    !isNewDocument && !!document.authorizationDocument?.id
  ).current;
  const { data: licenses = [], isLoading } = useLicenses();
  const licenseName = getLicenseName(document.license);
  const licenseId = document.license?.id;
  const hasAuthorization = !!document.authorizationDocument?.id;
  const option = hasAuthorization ? DOCUMENT_AUTHORIZE_TO_PUBLISH : null;
  const hasUnknownLicense =
    !isLoading && !!licenseName && !findLicenseByName(licenses, licenseName);

  useEffect(() => {
    if (document.selectOptionAuthorizationDocument !== option)
      updateAttribute('selectOptionAuthorizationDocument', option);
  }, [document.selectOptionAuthorizationDocument, option, updateAttribute]);

  useEffect(() => {
    const resolved = findLicenseByName(licenses, licenseName);
    if (resolved && resolved.id !== licenseId)
      updateAttribute('license', resolved);
  }, [licenses, licenseName, licenseId, updateAttribute]);

  return (
    <Box data-testid="collection-publication-rights" sx={{ mb: 2 }}>
      <AuthorizationDocumentSelect
        value={document.authorizationDocument}
        onChange={value => updateAttribute('authorizationDocument', value)}
        required={false}
        disableClearable={hasStoredAuthorization}
        disabled={disabled}
      />
      {hasAuthorization && (
        <DocumentLicenseSelect
          value={document.license}
          onChange={value => updateAttribute('license', value)}
          licenses={licenses}
          isLoading={isLoading}
          hasUnknownLicense={hasUnknownLicense}
          disabled={disabled}
        />
      )}
    </Box>
  );
};

CollectionPublicationRights.propTypes = { disabled: PropTypes.bool };

export default CollectionPublicationRights;
