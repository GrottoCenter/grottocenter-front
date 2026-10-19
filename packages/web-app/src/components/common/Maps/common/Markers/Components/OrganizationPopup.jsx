import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import {
  getOrganizationTypeLabelId,
  isOrganizationType
} from '@/utils/organizationTypes';
import CustomIcon from '../../../../CustomIcon';
import { Information } from './utils';

export const OrganizationPopup = ({ organization }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <Information
        isTitle
        value={organization.name && organization.name.toUpperCase()}
        url={`/ui/organizations/${organization.id}`}
      />
      {isOrganizationType(organization.type) && (
        <Information
          icon={
            <OrganizationIcon organizationType={organization.type} size={25} />
          }
          value={formatMessage({
            id: getOrganizationTypeLabelId(organization.type)
          })}
        />
      )}
      {organization.address && (
        <Information
          value={organization.address}
          icon={<CustomIcon size={25} type="location" />}
        />
      )}
    </>
  );
};

OrganizationPopup.propTypes = {
  organization: PropTypes.shape({
    name: PropTypes.string,
    id: PropTypes.number,
    address: PropTypes.string,
    type: PropTypes.string
  }).isRequired
};

export default OrganizationPopup;
