export const IMPERSONATABLE_ROLES = [
  'Moderator',
  'Leader',
  'User',
  'Anonymous'
];

export const IMPERSONATED_ROLE_KEY = 'grottocenter_impersonated_role';

export const isImpersonatableRole = roleName =>
  IMPERSONATABLE_ROLES.includes(roleName);
