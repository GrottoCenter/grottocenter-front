import React from 'react';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import { CircularProgress } from '@material-ui/core';
import OrganizationForm from '../../../components/appli/EntitiesForm/Organization';
import { makeOrganizationValueData } from '../../../components/appli/EntitiesForm/Organization/transformers';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';

const OrganizationEditContainer = ({ isFetching, organization, error }) => {
  const { formatMessage } = useIntl();

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
          <>
            <OrganizationForm
              organizationValues={makeOrganizationValueData(organization)}
            />
          </>
        )
      }
    />
  );
};

OrganizationEditContainer.propTypes = {
  organization: PropTypes.shape({
    name: PropTypes.shape({ message: PropTypes.string })
  }),
  error: PropTypes.shape({}),
  isFetching: PropTypes.bool
};

export default OrganizationEditContainer;
