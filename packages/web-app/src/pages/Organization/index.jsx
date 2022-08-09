import React, { useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchOrganization } from '../../actions/Organization/GetOrganization';
import { setPageTitle } from '../../actions/PageTitle';
import Organization from '../../components/appli/Organization';
import { usePermissions } from '../../hooks';

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
    dispatch(setPageTitle('Organization'));
  }, [dispatch, organizationId]);

  const onEdit = () => {
    history.push(`/ui/organizations/${organizationId}/edit`);
  };
  return (
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
