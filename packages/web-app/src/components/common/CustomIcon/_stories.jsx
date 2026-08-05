import { Typography } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { styled } from '@mui/material/styles';

import CustomIcon from './index';

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
`;

const meta = {
  title: 'CustomIcon',
  component: CustomIcon
};

export default meta;

export const Default = {
  render: () => (
    <Wrapper>
      <div>
        <Typography>Large</Typography>
        <PersonIcon color="primary" fontSize="large" />
        <CustomIcon type="entrance" />
        <CustomIcon type="depth" />
        <CustomIcon type="length" />
      </div>
      <div>
        <Typography>Default</Typography>
        <PersonIcon color="primary" />
        <CustomIcon type="entrance" size={24} />
        <CustomIcon type="depth" size={24} />
        <CustomIcon type="length" size={24} />
      </div>
      <div>
        <Typography>Small</Typography>
        <PersonIcon color="primary" fontSize="small" />
        <CustomIcon type="entrance" size={20} />
        <CustomIcon type="depth" size={20} />
        <CustomIcon type="length" size={20} />
      </div>
    </Wrapper>
  )
};
