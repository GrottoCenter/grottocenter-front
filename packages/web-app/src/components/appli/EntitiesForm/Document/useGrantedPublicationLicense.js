import { useQuery } from '@tanstack/react-query';
import { documentQueryOptions } from '@/api/documentQueryOptions';
import { getLicenseName } from '@/components/common/LicenseTag/helpers';
import { findLicenseByName, useLicenses } from '@/hooks/queries/useLicenses';
import { DocumentTypes } from '@/utils/documentTypeHelpers';

const useGrantedPublicationLicense = authorizationId => {
  const authorization = useQuery({
    ...documentQueryOptions(authorizationId),
    staleTime: 0,
    refetchOnMount: 'always'
  });
  const licenses = useLicenses({ enabled: !!authorizationId });
  const details = authorization.data;
  const isLoading =
    !!authorizationId && (authorization.isFetching || licenses.isFetching);
  const isUsable =
    details?.type === DocumentTypes.AUTHORIZATION_TO_PUBLISH &&
    !details.isDeleted &&
    details.validationStatus !== 'pending' &&
    details.validationStatus !== 'rejected' &&
    (details.isValidated !== false ||
      details.validationStatus === 'modificationPending');
  const license =
    isUsable &&
    !isLoading &&
    !authorization.isError &&
    !authorization.isPaused &&
    !licenses.isError &&
    !licenses.isPaused
      ? findLicenseByName(licenses.data, getLicenseName(details.license))
      : undefined;

  return {
    license,
    isLoading,
    retry: () => Promise.all([authorization.refetch(), licenses.refetch()])
  };
};

export default useGrantedPublicationLicense;
