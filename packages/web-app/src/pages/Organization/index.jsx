import { useParams } from 'react-router-dom';

import Organization from '../../components/appli/Organization';
import { useOrganization, usePermissions } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const OrganizationPage = () => {
  const { organizationId } = useParams();
  const permissions = usePermissions();
  const {
    data: organization,
    error,
    isFetching,
    isPaused
  } = useOrganization(organizationId);

  return organization?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.organization} entity={organization} />
  ) : (
    <Organization
      key={organizationId}
      error={error}
      isPaused={isPaused}
      isLoading={isFetching}
      organization={organization}
    />
  );
};
export default OrganizationPage;
