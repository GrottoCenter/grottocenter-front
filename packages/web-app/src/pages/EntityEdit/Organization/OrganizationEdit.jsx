import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import OrganizationForm from '../../../components/appli/EntitiesForm/Organization';
import { makeOrganizationValueData } from '../../../components/appli/EntitiesForm/Organization/transformers';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';
import { fetchOrganization } from '../../../actions/Organization/GetOrganization';

const OrganizationEdit = () => {
  const { organizationId } = useParams();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();

  const { organization, isFetching, error } = useSelector(
    state => state.organization
  );

  useEffect(() => {
    dispatch(fetchOrganization(organizationId));
  }, [organizationId, dispatch]);
  if (!isNil(error)) {
    return (
      <Translate>
        Error, the organization data you are looking for is not available.
      </Translate>
    );
  }

  return (
    <Layout
      title={
        organization?.name ||
        formatMessage({ id: 'Loading the organization data...' })
      }
      content={
        !isFetching && !organization ? (
          <CircularProgress />
        ) : (
          <OrganizationForm
            organizationValues={makeOrganizationValueData(organization)}
          />
        )
      }
    />
  );
};

OrganizationEdit.propTypes = {
  organization: PropTypes.shape({
    name: PropTypes.shape({ message: PropTypes.string })
  }),
  error: PropTypes.shape({})
};

export default OrganizationEdit;
