import { Box } from '@mui/material';

import RoleChip from './RoleChip';

const roles = [
  'Administrator',
  'Moderator',
  'Leader',
  'User',
  'Visitor',
  'Anonymous'
];

export default {
  title: 'Common/RoleChip',
  component: RoleChip,
  args: { roleName: 'Moderator' },
  argTypes: { roleName: { control: 'select', options: roles } }
};

export const Default = {};

export const AllRoles = {
  render: () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {roles.map(role => (
        <RoleChip key={role} roleName={role} />
      ))}
    </Box>
  )
};
