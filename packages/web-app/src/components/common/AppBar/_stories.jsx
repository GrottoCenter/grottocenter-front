import PropTypes from 'prop-types';
import { action } from 'storybook/actions';

import AppBar from './index';
import User from './User';

const UserWithState = ({ isAuth }) => (
  <User
    isAuth={isAuth}
    onLoginClick={action('onLoginClick')}
    onLogoutClick={action('onLogoutClick')}
  />
);

UserWithState.propTypes = {
  isAuth: PropTypes.bool.isRequired
};

const meta = {
  title: 'AppBar',
  component: AppBar
};

export default meta;

export const Default = {
  render: () => <AppBar />
};

export const UserMenuLogged = {
  name: 'User menu, logged',
  render: () => <UserWithState isAuth />
};

export const UserMenuNotLogged = {
  name: 'User menu, not logged',
  render: () => <UserWithState isAuth={false} />
};
