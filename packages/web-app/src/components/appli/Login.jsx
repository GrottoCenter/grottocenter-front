import React from 'react';
import { Button, CircularProgress, Typography, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty, match } from 'ramda';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { WarningRounded } from '@mui/icons-material';

import {
  hideLoginDialog,
  postLogin,
  postForgotPassword
} from '../../actions/Login';

import { emailRegexp } from '../../conf/config';
import Translate from '../common/Translate';
import StandardDialog from '../common/StandardDialog';
import LoginForm from '../common/LoginForm';
import { useNotification } from '../../hooks';

const Login = () => {
  const dispatch = useDispatch();
  const authState = useSelector(state => state.login);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [authErrorMessages, setAuthErrorMessages] = React.useState([]);
  const navigate = useNavigate();
  const { onSuccess } = useNotification();
  const { formatMessage } = useIntl();

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
    if (newAuthErrorMessages.length !== 0) return;

    if (authState.isMustResetMessageDisplayed) {
      dispatch(
        postForgotPassword(email, msg =>
          onSuccess(formatMessage({ id: msg }, { email }))
        )
      );
    } else {
      dispatch(postLogin(email, password));
    }
  };

  const LoginButtonMessage = authState.isMustResetMessageDisplayed ? (
    <Translate>Send reset email</Translate>
  ) : (
    <Translate>Log in</Translate>
  );
  const LoginButton = (
    <Button
      key={0}
      type="submit"
      size="large"
      onClick={onLogin}
      color={authState.isFetching ? 'inherit' : 'primary'}>
      {authState.isFetching ? (
        <CircularProgress size="2.8rem" />
      ) : (
        LoginButtonMessage
      )}
    </Button>
  );

  const handleCreateAccount = () => {
    navigate(`/ui/signup`);
    dispatch(hideLoginDialog());
  };

  const handleForgotPassword = () => {
    navigate(`/ui/forgotPassword`);
    dispatch(hideLoginDialog());
  };

  const DialogContent = authState.isMustResetMessageDisplayed ? (
    <>
      <Box
        display="flex"
        height={60}
        alignItems="center"
        justifyContent="center">
        <WarningRounded
          htmlColor="#f44336"
          style={{ fontSize: 80, paddingBottom: 20 }}
        />
      </Box>
      <Typography
        variant="h6"
        style={{ textAlign: 'center', paddingBottom: 5 }}>
        <Translate>
          For security reasons please create a new password.
        </Translate>
      </Typography>
      <Typography
        variant="body2"
        style={{ textAlign: 'center', paddingBottom: 10 }}>
        <Translate>
          We have changed the way passwords are saved to make it more secure.
        </Translate>
      </Typography>
      <Typography variant="body1" style={{ textAlign: 'center' }}>
        <Translate>An email will be sent to:</Translate> <b>{email}</b>
      </Typography>
    </>
  ) : (
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
  );

  return (
    <StandardDialog
      open={authState.isLoginDialogDisplayed}
      onClose={() => dispatch(hideLoginDialog())}
      title={<Translate>Log in</Translate>}
      actions={[LoginButton]}>
      {DialogContent}
    </StandardDialog>
  );
};

Login.propTypes = {};

export default Login;
