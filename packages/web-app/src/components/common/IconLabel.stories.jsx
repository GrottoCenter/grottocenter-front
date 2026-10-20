import { Box } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';
import AppLink from './AppLink';
import CustomIcon from './CustomIcon';
import IconLabel from './IconLabel';

const meta = { title: 'Common/IconLabel', component: IconLabel };
export default meta;

export const Default = {
  args: {
    icon: <CustomIcon type="organization_club" size={20} alt="" />,
    children: 'Caving group'
  }
};

export const Narrow = {
  args: {
    icon: <CustomIcon type="person" size={18} alt="" />,
    children: 'Marie Jeanne Dupont (Caver)',
    alignToFirstLine: true
  },
  render: args => (
    <Box sx={{ width: 120 }}>
      <IconLabel {...args} />
    </Box>
  )
};

export const Notification = {
  args: { icon: <PublishIcon fontSize="small" />, children: 'CSV import' }
};

export const WithoutIcon = { args: { children: 'Unknown' } };

export const Link = {
  args: Narrow.args,
  render: args => (
    <Box sx={{ width: 120 }}>
      <AppLink href="https://grottocenter.org">
        <IconLabel {...args} />
      </AppLink>
    </Box>
  )
};
