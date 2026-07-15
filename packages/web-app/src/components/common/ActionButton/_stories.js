import ActionButton from './index';

const meta = {
  title: 'ActionButton',
  component: ActionButton,
  args: {
    label: 'Action button',
    onClick: () => {},
    disabled: false,
    loading: false,
    color: 'primary'
  },
  argTypes: {
    color: {
      control: 'select',
      options: ['primary', 'secondary']
    }
  }
};

export default meta;

export const Default = {};
