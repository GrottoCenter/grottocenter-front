import { action } from 'storybook/actions';
import { expect, waitFor, within } from 'storybook/test';
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
    centerContentMobile = false,
    isLongContent = false
  }) => (
    <StandardDialog
      open
      onClose={action('onClose')}
      title="Edit the entrance"
      isBusy={isBusy}
      fullScreenOnMobile={fullScreenOnMobile}
      centerContentMobile={centerContentMobile}
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

export const CenteredContent = {
  ...Default,
  args: { centerContentMobile: true, fullScreenOnMobile: true },
  play: async ({ canvasElement }) => {
    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      'dialog'
    );
    const content = dialog.querySelector('.MuiDialogContent-root');
    await waitFor(() => {
      const bounds = content.getBoundingClientRect();
      const first = content.firstElementChild.getBoundingClientRect();
      const last = content.lastElementChild.getBoundingClientRect();
      expect(first.top).toBeGreaterThanOrEqual(bounds.top);
      if (
        content.ownerDocument.defaultView.matchMedia('(max-width: 599.95px)')
          .matches &&
        content.scrollHeight <= content.clientHeight
      ) {
        expect(
          Math.abs(
            (first.top + last.bottom) / 2 - (bounds.top + bounds.bottom) / 2
          )
        ).toBeLessThanOrEqual(1);
      }
    });
  }
};

export const CenteredLongContent = {
  ...CenteredContent,
  args: { ...CenteredContent.args, isLongContent: true }
};
