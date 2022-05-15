import React from 'react';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';
import PropTypes from 'prop-types';
import OrganizationForm from '../../../components/appli/EntitiesForm/Organization';
import { makeOrganizationValueData } from '../../../components/appli/EntitiesForm/Organization/transformers';
import Spinner from '../../../components/common/Spinner';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';

const OrganizationEditContainer = ({ isFetching, organization, error }) => {
  const { formatMessage } = useIntl();

  const Center = styled.div`
    padding: 10%;
  `;

  if (!isNil(error)) {
    return (
      <Translate>
        Error, the massif data you are looking for is not available.
      </Translate>
    );
  }

  return (
    <Layout
      title={
        organization?.name ||
        formatMessage({ id: 'Loading organization data...' })
      }
      content={
        !isFetching && !organization ? (
          <Center>
            <Spinner text={' '} size={100} />
          </Center>
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
