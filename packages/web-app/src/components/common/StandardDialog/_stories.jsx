import { styled } from '@mui/material/styles';
import { action } from 'storybook/actions';
import SendIcon from '@mui/icons-material/Send';
import { Button } from '@mui/material';
import StandardDialog from './index';

const Content = styled('div')`
  background-color: #4caf50;
  height: 400px;
  width: 500px;
`;

const meta = {
  title: 'Standard dialog',
  component: StandardDialog
};

export default meta;

export const Default = {
  render: () => (
    <StandardDialog
      maxWidth="lg"
      open
      onClose={action('onClose')}
      title="title"
      actions={[
        <Button key={0} onClick={action('Action')} color="primary">
          <>
            <SendIcon color="inherit" />
            Action
          </>
        </Button>
      ]}>
      <Content />
    </StandardDialog>
  )
};
