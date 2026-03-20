import React from 'react';
import PropTypes from 'prop-types';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import AppBar from './index';
import User from './User';

const UserWithState = ({ isAuth }) => (
  <User
    isAuth={isAuth}
    onLoginClick={action('onLoginClick')}
    onLogoutClick={action('onLogouClick')}
  />
);

UserWithState.propTypes = {
  isAuth: PropTypes.bool.isRequired
};

storiesOf('AppBar', module)
  .add('Default', () => <AppBar />)
  .add('User menu, logged', () => <UserWithState isAuth />)
  .add('User menu, not logged', () => <UserWithState isAuth={false} />);
