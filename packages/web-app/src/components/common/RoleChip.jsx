import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Chip } from '@mui/material';

import RoleIcon from './RoleIcon';

const RoleChip = ({ roleName, sx = {} }) => {
  const { formatMessage } = useIntl();

  return (
    <Chip
      component="span"
      data-testid={`role-chip-${roleName}`}
      icon={<RoleIcon roleName={roleName} />}
      label={formatMessage({ id: roleName, defaultMessage: roleName })}
      variant="outlined"
      size="small"
      sx={[
        { '& .MuiChip-icon': { color: 'inherit' } },
        ...(Array.isArray(sx) ? sx : [sx])
      ]}
    />
  );
};

RoleChip.propTypes = {
  roleName: PropTypes.string.isRequired,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.array, PropTypes.func])
};

export default RoleChip;
