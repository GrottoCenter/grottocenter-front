import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import AppLink from '@/components/common/AppLink';

const OrganizationActionButtons = ({
  organization,
  onPreview,
  showIdInLabel = false
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

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          onClick={() => onPreview(organization.id)}>
          <VisibilityIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title={editLabel}>
        <IconButton
          component={AppLink}
          to={`/ui/organizations/${organization.id}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={editLabel}>
          <EditIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

OrganizationActionButtons.propTypes = {
  organization: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onPreview: PropTypes.func.isRequired,
  showIdInLabel: PropTypes.bool
};

export default OrganizationActionButtons;
