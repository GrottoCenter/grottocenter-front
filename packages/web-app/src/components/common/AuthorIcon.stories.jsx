import AuthorIcon from './AuthorIcon';

export default {
  title: 'Common/AuthorIcon',
  component: AuthorIcon,
  args: { titleAccess: 'Author', fontSize: 'large' }
};

export const Default = {};
export const Small = { args: { fontSize: 'small' } };
export const Primary = { args: { color: 'primary' } };
export const Disabled = { args: { color: 'disabled' } };
