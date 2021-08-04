import React from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, match } from 'ramda';
import { hideLoginDialog, postLogin } from '../actions/Login';

import { emailRegexp } from '../conf/Config';
import Translate from '../components/common/Translate';
import StandardDialog from '../components/common/StandardDialog';
import LoginForm from '../components/common/LoginForm';

const Login = () => {
  const dispatch = useDispatch();
  const authState = useSelector(state => state.login);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authErrorMessages, setAuthErrorMessages] = React.useState([]);

  const onLogin = event => {
    event.preventDefault();

    const newAuthErrorMessages = [
      ...(isEmpty(email) ? ['You must provide an email.'] : []),
      ...(!!isEmpty(match(emailRegexp, email)) && !isEmpty(email)
        ? ['You must provide a valid email.']
        : []),
      ...(isEmpty(password) ? ['You must provide a password.'] : [])
    ];

    setAuthErrorMessages(newAuthErrorMessages);
    if (newAuthErrorMessages.length === 0) {
      dispatch(postLogin(email, password));
    }
  };

  const LoginButton = (
    <Button
      key={0}
      type="submit"
      size="large"
      onClick={onLogin}
      color={authState.isFetching ? 'default' : 'primary'}>
      {authState.isFetching ? (
        <CircularProgress size="2.8rem" />
      ) : (
        <Translate>Log in</Translate>
      )}
    </Button>
  );

  return (
    <StandardDialog
      open={authState.isLoginDialogDisplayed}
      onClose={() => dispatch(hideLoginDialog())}
      title={<Translate>Log in</Translate>}
      actions={[LoginButton]}>
      <LoginForm
        authErrors={authErrorMessages}
        email={email}
        isFetching={authState.isFetching}
        onEmailChange={setEmail}
        onLogin={onLogin}
        onPasswordChange={setPassword}
        password={password}
      />
    </StandardDialog>
  );
};

Login.propTypes = {};

export default Login;
