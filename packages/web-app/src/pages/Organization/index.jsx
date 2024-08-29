import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { fetchOrganization } from '../../actions/Organization/GetOrganization';
import Organization from '../../components/appli/Organization';
import { usePermissions } from '../../hooks';
import {
  Deleted,
  DELETED_ENTITIES
} from '../../components/common/card/Deleted';

const OrganizationPage = () => {
  const { organizationId } = useParams();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { organization, error, isLoading } = useSelector(
    state => state.organization
  );

  useEffect(() => {
    dispatch(fetchOrganization(organizationId));
  }, [dispatch, organizationId]);

  return organization?.isDeleted && !permissions.isModerator ? (
    <Deleted entityType={DELETED_ENTITIES.organization} entity={organization} />
  ) : (
    <Organization
      error={error}
      isLoading={isLoading}
      organization={organization}
    />
  );
};
export default OrganizationPage;
