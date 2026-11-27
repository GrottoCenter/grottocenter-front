import { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Stack } from '@mui/material';
import { useIntl } from 'react-intl';
import { getLicenseName } from '@/components/common/LicenseTag/helpers';
import { findLicenseByName, useLicenses } from '@/hooks';
import { DocumentFormContext } from '../Provider';
import DocumentLicenseSelect from './DocumentLicenseSelect';

const GrantedLicenseField = ({ disabled = false }) => {
  const { formatMessage } = useIntl();
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const { data: licenses, isLoading } = useLicenses();
  const name = getLicenseName(document.license);
  const resolved = findLicenseByName(licenses, name);

  useEffect(() => {
    if (resolved && resolved.id !== document.license?.id) {
      updateAttribute('license', resolved);
    }
  }, [resolved, document.license?.id, updateAttribute]);

  return (
    <Stack spacing={0.5} sx={{ maxWidth: '42rem' }}>
      <DocumentLicenseSelect
        label="documentForm.grantedLicense"
        description={formatMessage({ id: 'documentForm.grantedLicenseScope' })}
        value={document.license}
        onChange={value => updateAttribute('license', value)}
        licenses={licenses}
        isLoading={isLoading}
        disabled={disabled}
        hasUnknownLicense={!!licenses && !!name && !resolved}
      />
    </Stack>
  );
};

GrantedLicenseField.propTypes = { disabled: PropTypes.bool };

export default GrantedLicenseField;
