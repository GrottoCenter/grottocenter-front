import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Tooltip } from '@mui/material';
import CustomIcon from '@/components/common/CustomIcon';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import { getDocumentTypeIcon } from '@/utils/documentTypeHelpers';
import { getOrganizationTypeLabelId } from '@/utils/organizationTypes';
import { DELETED_ENTITY_RESOURCES } from '@/utils/deletedEntities';

const EntityIcon = ({ resource, entity }) => {
  const { formatMessage } = useIntl();
  const type = entity.type?.name ?? entity.type;
  if (resource === 'organizations') {
    return (
      <Tooltip title={formatMessage({ id: getOrganizationTypeLabelId(type) })}>
        <span>
          <OrganizationIcon organizationType={type} size={24} />
        </span>
      </Tooltip>
    );
  }
  if (resource === 'documents') {
    const Icon = getDocumentTypeIcon(type);
    const label = formatMessage({ id: type || 'unknown' });
    return (
      <Tooltip title={label}>
        <Icon aria-label={label} sx={{ color: 'primary.main' }} />
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
