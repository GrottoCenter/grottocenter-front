import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Tooltip } from '@mui/material';
import CustomIcon from '@/components/common/CustomIcon';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import { getDocumentTypeIcon } from '@/utils/documentTypeHelpers';
import { getOrganizationTypeLabelId } from '@/utils/organizationTypes';
import { DELETED_ENTITY_RESOURCES } from '@/utils/deletedEntities';

const EntityIcon = ({ resource, entity }) => {
  const { formatMessage } = useIntl();
  const type = entity.type?.name ?? entity.type;
  if (resource === 'organizations') {
    const label = formatMessage({ id: getOrganizationTypeLabelId(type) });
    return (
      <Tooltip title={label}>
        <Box
          component="span"
          role="img"
          aria-label={label}
          tabIndex={0}
          sx={{ display: 'inline-flex' }}>
          <OrganizationIcon organizationType={type} size={24} />
        </Box>
      </Tooltip>
    );
  }
  if (resource === 'documents') {
    const Icon = getDocumentTypeIcon(type);
    const label = formatMessage({ id: type || 'unknown' });
    return (
      <Tooltip title={label}>
        <Icon
          role="img"
          aria-hidden={false}
          aria-label={label}
          tabIndex={0}
          sx={{ color: 'primary.main' }}
        />
      </Tooltip>
    );
  }
  return (
    <CustomIcon
      type={DELETED_ENTITY_RESOURCES[resource].entityType.iconType}
      size={24}
      alt=""
    />
  );
};

EntityIcon.propTypes = {
  resource: PropTypes.string.isRequired,
  entity: PropTypes.shape({
    type: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({ name: PropTypes.string })
    ])
  }).isRequired
};

export default EntityIcon;
