import CopyToClipboardIconButton from './CopyToClipboardIconButton';

const meta = {
  title: 'Common/CopyToClipboardIconButton',
  component: CopyToClipboardIconButton
};
export default meta;

export const Default = {
  args: {
    value: 'Text copied from the component',
    label: 'Copy text',
    successLabel: 'Text copied',
    errorLabel: 'Unable to copy text'
  }
};

export const Compact = {
  args: {
    ...Default.args,
    compact: true
  }
};
