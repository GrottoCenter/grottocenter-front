import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import EntityActionButtons from '@/components/common/EntityActionButtons';

const OrganizationActionButtons = ({
  organization,
  onPreview,
  showIdInLabel = false,
  showOpenLink = false,
  showEditLink = true,
  isDisabled = false
}) => {
  const { formatMessage } = useIntl();
  const name = showIdInLabel
    ? `${organization.name} (#${organization.id})`
    : organization.name;
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
      edit={
        showEditLink
          ? {
              to: `/ui/organizations/${organization.id}/edit`,
              label: editLabel
            }
          : null
      }
      open={
        showOpenLink
          ? {
              to: `/ui/organizations/${organization.id}`,
              label: openLabel,
              testId: `open-organization-${organization.id}`
            }
          : null
      }
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
  showIdInLabel: PropTypes.bool,
  showOpenLink: PropTypes.bool,
  showEditLink: PropTypes.bool,
  isDisabled: PropTypes.bool
};

export default OrganizationActionButtons;
