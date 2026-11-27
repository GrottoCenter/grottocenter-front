import { useContext } from 'react';
import { Alert, Button, Skeleton, Stack, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import LicenseTag from '@/components/common/LicenseTag';
import { DocumentFormContext } from '../Provider';
import DocumentLicenseDeedLink from './DocumentLicenseDeedLink';

const AuthorizationGrantedLicense = () => {
  const { formatMessage } = useIntl();
  const { grantedPublicationLicense } = useContext(DocumentFormContext);
  const { license, isLoading, retry } = grantedPublicationLicense ?? {};

  if (isLoading) return <Skeleton height={52} />;
  if (!license)
    return (
      <Alert
        severity="warning"
        action={
          <Button type="button" color="inherit" size="small" onClick={retry}>
            {formatMessage({ id: 'Retry' })}
          </Button>
        }>
        {formatMessage({ id: 'documentForm.unavailableGrantedLicense' })}
      </Alert>
    );

  return (
    <Stack spacing={0.5} data-testid="authorization-granted-license">
      <Typography variant="body2" color="text.secondary">
        {formatMessage({ id: 'documentForm.licenseFromAuthorization' })}
      </Typography>
      <LicenseTag license={license} />
      {license.url && <DocumentLicenseDeedLink url={license.url} />}
    </Stack>
  );
};

export default AuthorizationGrantedLicense;
