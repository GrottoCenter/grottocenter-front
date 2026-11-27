import RoleLabel from './RoleLabel';

export default {
  title: 'Common/RoleLabel',
  component: RoleLabel,
  args: { roleName: 'Moderator' }
};

export const Moderator = {};
export const Administrator = { args: { roleName: 'Administrator' } };
export const Leader = { args: { roleName: 'Leader' } };
export const User = { args: { roleName: 'User' } };
export const Visitor = { args: { roleName: 'Visitor' } };
export const Anonymous = { args: { roleName: 'Anonymous' } };
