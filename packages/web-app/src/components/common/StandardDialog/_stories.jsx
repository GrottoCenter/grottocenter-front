import { action } from 'storybook/actions';
import { Button, TextField, Typography } from '@mui/material';
import StandardDialog from './index';

const meta = {
  title: 'Standard dialog',
  component: StandardDialog
};

export default meta;

export const Default = {
  render: ({
    actionsPosition = 'bottom',
    isBusy = false,
    fullScreenOnMobile = false,
    isLongContent = false
  }) => (
    <StandardDialog
      open
      onClose={action('onClose')}
      title="Edit the entrance"
      isBusy={isBusy}
      fullScreenOnMobile={fullScreenOnMobile}
      actionsPosition={actionsPosition}
      actions={[
        <Button
          key="cancel"
          variant="outlined"
          disabled={isBusy}
          onClick={action('onClose')}>
          Cancel
        </Button>,
        <Button
          key="save"
          variant="contained"
          loading={isBusy}
          loadingPosition="start"
          onClick={action('onSave')}>
          Save changes
        </Button>
      ]}>
      <TextField label="Name" fullWidth disabled={isBusy} sx={{ mb: 2 }} />
      {Array.from({ length: isLongContent ? 20 : 1 }, (_item, index) => (
        <Typography key={index} paragraph>
          Describe the access route and the conditions at the entrance. Keep
          information useful for the next visitor.
        </Typography>
      ))}
    </StandardDialog>
  )
};

export const HeaderActions = {
  ...Default,
  args: { actionsPosition: 'top' }
};

export const LongForm = {
  ...Default,
  args: { isLongContent: true, fullScreenOnMobile: true }
};

export const Saving = {
  ...Default,
  args: { isBusy: true }
};
