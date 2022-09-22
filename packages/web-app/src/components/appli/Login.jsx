import React from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, match } from 'ramda';
import { useHistory } from 'react-router-dom';
import { hideLoginDialog, postLogin } from '../../actions/Login';

import { emailRegexp } from '../../conf/config';
import Translate from '../common/Translate';
import StandardDialog from '../common/StandardDialog';
import LoginForm from '../common/LoginForm';

const Login = () => {
  const dispatch = useDispatch();
  const authState = useSelector(state => state.login);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authErrorMessages, setAuthErrorMessages] = React.useState([]);
  const history = useHistory();

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

  const handleCreateAccount = () => {
    history.push(`/ui/signup`);
    dispatch(hideLoginDialog());
  };

  const handleForgotPassword = () => {
    history.push(`/ui/forgotPassword`);
    dispatch(hideLoginDialog());
  };

  return (
    <StandardDialog
      open={authState.isLoginDialogDisplayed}
      onClose={() => dispatch(hideLoginDialog())}
      title={<Translate>Log in</Translate>}
      actions={[LoginButton]}>
      <>
        <LoginForm
          authErrors={authErrorMessages}
          email={email}
          isFetching={authState.isFetching}
          onEmailChange={setEmail}
          onLogin={onLogin}
          onPasswordChange={setPassword}
          password={password}
        />
        <Button size="small" variant="text" onClick={handleCreateAccount}>
          <Translate>No account yet?</Translate>
        </Button>
        <Button size="small" variant="text" onClick={handleForgotPassword}>
          <Translate>Forgot password?</Translate>
        </Button>
      </>
    </StandardDialog>
  );
};

Login.propTypes = {};

export default Login;
