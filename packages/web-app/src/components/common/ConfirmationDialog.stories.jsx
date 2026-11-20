import { action } from 'storybook/actions';
import ConfirmationDialog from './ConfirmationDialog';

export default {
  title: 'Common/ConfirmationDialog',
  component: ConfirmationDialog,
  args: {
    open: true,
    title: 'Unlink the entrance?',
    confirmLabel: 'Unlink',
    color: 'error',
    onClose: action('onClose'),
    onConfirm: action('onConfirm'),
    children: 'The entrance remains available in Grottocenter.'
  }
};

export const Default = {};
export const Pending = { args: { isBusy: true } };
export const LongLabels = {
  args: {
    cancelLabel: 'Keep this entrance linked to the organization',
    confirmLabel: 'Remove only the link to this organization'
  }
};
