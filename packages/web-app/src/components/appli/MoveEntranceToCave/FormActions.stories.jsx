import { action } from 'storybook/actions';
import FormActions from './FormActions';

const meta = {
  title: 'Appli/MoveEntranceToCave/FormActions',
  component: FormActions,
  args: {
    confirmLabel: 'Attach the entrance',
    onConfirm: action('confirm'),
    onCancel: action('cancel')
  }
};
export default meta;

export const Default = {};
export const Pending = { args: { loading: true } };
export const Disabled = { args: { disabled: true } };
export const WithTooltip = {
  args: { confirmTooltip: 'Confirm the attachment' }
};
