import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadOrganization } from '../../../actions/Organization';
import OrganizationEditContainer from './OrganizationEditContainer';

const OrganizationEdit = () => {
  const { organizationId } = useParams();
  const dispatch = useDispatch();

  const { organization, isFetching, error } = useSelector(
    state => state.organization
  );

  useEffect(() => {
    dispatch(loadOrganization(organizationId));
  }, [organizationId, dispatch]);

  return (
    <OrganizationEditContainer
      isFetching={isFetching}
      organization={organization}
      error={error}
    />
  );
};

export default OrganizationEdit;
