import RoleIcon from './RoleIcon';

export default {
  title: 'Common/RoleIcon',
  component: RoleIcon,
  args: { roleName: 'Moderator' }
};

export const Moderator = {};
export const Administrator = { args: { roleName: 'Administrator' } };
export const Leader = { args: { roleName: 'Leader' } };
export const User = { args: { roleName: 'User' } };
export const Visitor = { args: { roleName: 'Visitor' } };
export const Anonymous = { args: { roleName: 'Anonymous' } };
