import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { loadOrganization } from '../actions/Organization';
import { setPageTitle } from '../actions/PageTitle';
import Organization from '../components/appli/Organization';

const OrganizationPage = () => {
  const { organizationId } = useParams();
  const dispatch = useDispatch();
  const { organization, error, isLoading } = useSelector(
    state => state.organization
  );

  useEffect(() => {
    dispatch(loadOrganization(organizationId));
    dispatch(setPageTitle('Organization'));
  }, [dispatch, organizationId]);

  return (
    <Organization
      error={error}
      isLoading={isLoading}
      organization={organization}
    />
  );
};
export default OrganizationPage;
