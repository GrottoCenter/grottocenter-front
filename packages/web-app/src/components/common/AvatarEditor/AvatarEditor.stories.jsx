import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AvatarEditor from './AvatarEditor';

const InteractiveEditor = ({ isOrganization = false }) => {
  const [avatarUrl, setAvatarUrl] = useState(null);
  useEffect(
    () => () => {
      if (avatarUrl) URL.revokeObjectURL(avatarUrl);
    },
    [avatarUrl]
  );
  return (
    <AvatarEditor
      name="Alex Martin"
      isOrganization={isOrganization}
      avatarUrl={avatarUrl}
      onChange={async file =>
        setAvatarUrl(file ? URL.createObjectURL(file) : null)
      }
    />
  );
};
InteractiveEditor.propTypes = { isOrganization: PropTypes.bool };

export default { title: 'Common/AvatarEditor', component: AvatarEditor };
export const ProfilePhoto = { render: () => <InteractiveEditor /> };
export const OrganizationLogo = {
  render: () => <InteractiveEditor isOrganization />
};
export const Offline = {
  args: { name: 'Alex Martin', isOnline: false, onChange: async () => {} }
};
export const Uploading = {
  args: { name: 'Alex Martin', isPending: true, onChange: async () => {} }
};
