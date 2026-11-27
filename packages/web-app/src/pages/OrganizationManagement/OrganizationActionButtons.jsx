import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import EntityActionButtons from '@/components/common/EntityActionButtons';

const OrganizationActionButtons = ({
  organization,
  onPreview,
  isDisabled = false
}) => {
  const { formatMessage } = useIntl();
  const name = `${organization.name} (#${organization.id})`;
  const label = formatMessage({ id: 'View organization {name}' }, { name });
  const editLabel = formatMessage(
    { id: 'Edit organization {name} in new tab' },
    { name }
  );
  const openLabel = formatMessage(
    { id: 'Open organization {name} in new tab' },
    { name }
  );

  return (
    <EntityActionButtons
      preview={{
        label,
        testId: `preview-organization-${organization.id}`,
        onClick: () => onPreview(organization.id)
      }}
      edit={{
        to: `/ui/organizations/${organization.id}/edit`,
        label: editLabel
      }}
      open={{
        to: `/ui/organizations/${organization.id}`,
        label: openLabel,
        testId: `open-organization-${organization.id}`
      }}
      isDisabled={isDisabled}
    />
  );
};

OrganizationActionButtons.propTypes = {
  organization: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  isDisabled: PropTypes.bool
};

export default OrganizationActionButtons;
