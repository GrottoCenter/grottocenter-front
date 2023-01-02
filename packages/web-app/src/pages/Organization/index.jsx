import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchOrganization } from '../../actions/Organization/GetOrganization';
import Organization from '../../components/appli/Organization';
import { usePermissions } from '../../hooks';
import getAuthor from '../../util/getAuthor';
import Deleted, {
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const OrganizationPage = () => {
  const { organizationId } = useParams();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { organization, error, isLoading } = useSelector(
    state => state.organization
  );

  const canEdit = permissions.isAuth;

  const history = useHistory();

  useEffect(() => {
    dispatch(fetchOrganization(organizationId));
  }, [dispatch, organizationId]);

  const onEdit = () => {
    history.push(`/ui/organizations/${organizationId}/edit`);
  };
  return organization?.isDeleted ? (
    <Deleted
      redirectTo={organization.redirectTo}
      entity={DELETED_ENTITIES.organization}
      name={organization.name}
      creationDate={organization.dateInscription}
      dateReviewed={organization.dateReviewed}
      author={getAuthor(organization.author)}
      reviewer={getAuthor(organization.reviewer)}
    />
  ) : (
    <Organization
      error={error}
      isLoading={isLoading}
      organization={organization}
      onEdit={onEdit}
      canEdit={canEdit}
    />
  );
};
export default OrganizationPage;
