import { isNil } from 'ramda';
import { useIntl } from 'react-intl';
import { CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import OrganizationForm from '../../../components/appli/EntitiesForm/Organization';
import { makeOrganizationValueData } from '../../../components/appli/EntitiesForm/Organization/transformers';
import Layout from '../../../components/common/Layouts/Fixed/FixedContent';
import Translate from '../../../components/common/Translate';
import { useOrganization } from '../../../hooks';

const OrganizationEdit = () => {
  const { organizationId } = useParams();
  const navigate = useNavigate();
  const { formatMessage } = useIntl();

  const {
    data: organization,
    isFetching,
    error
  } = useOrganization(organizationId);

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
            onCancel={() => navigate(`/ui/organizations/${organizationId}`)}
          />
        )
      }
    />
  );
};

export default OrganizationEdit;
