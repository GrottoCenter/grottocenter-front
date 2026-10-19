import { Stack } from '@mui/material';
import { ORGANIZATION_TYPE_VALUES } from '@/utils/organizationTypes';
import OrganizationIcon from './OrganizationIcon';

const meta = { title: 'Common/OrganizationIcon', component: OrganizationIcon };
export default meta;
export const AllTypes = {
  render: () => (
    <Stack direction="row" spacing={2}>
      {[...ORGANIZATION_TYPE_VALUES, null, 'UNKNOWN'].map(type => (
        <OrganizationIcon
          key={String(type)}
          organizationType={type}
          size={48}
        />
      ))}
    </Stack>
  )
};
