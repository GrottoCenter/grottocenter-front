import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import AvatarEditor from '@/components/common/AvatarEditor/AvatarEditor';
import { useAvatar, useOnlineStatus, usePermissions } from '@/hooks';

const OrganizationAvatarEditor = ({
  organizationId,
  avatarUrl,
  name,
  isDisabled
}) => {
  const { formatMessage } = useIntl();
  const mutation = useAvatar({ organizationId });
  const isOnline = useOnlineStatus();
  const { isAuth } = usePermissions();
  if (!isAuth) return null;
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 1.5 }}>
        {formatMessage({ id: 'avatar.logo' })}
      </Typography>
      <AvatarEditor
        avatarUrl={avatarUrl}
        name={name}
        isOrganization
        isPending={mutation.isPending}
        isDisabled={isDisabled}
        isOnline={isOnline}
        onChange={mutation.mutateAsync}
      />
    </Box>
  );
};

OrganizationAvatarEditor.propTypes = {
  organizationId: PropTypes.number.isRequired,
  avatarUrl: PropTypes.string,
  name: PropTypes.string,
  isDisabled: PropTypes.bool.isRequired
};

export default OrganizationAvatarEditor;
