import ProfileAvatar from './ProfileAvatar';

export default { title: 'Common/ProfileAvatar', component: ProfileAvatar };
export const Caver = { args: { name: 'Alex Martin', size: 96 } };
export const Account = {
  args: { name: 'Alex Martin', size: 80 }
};
export const Organization = {
  args: { name: 'Caving club', isOrganization: true, size: 80 }
};
export const BrokenImage = {
  args: { name: 'Alex Martin', avatarUrl: '/missing-photo.webp' }
};
