import React, { useEffect } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Divider,
  Typography,
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { isEmpty } from 'ramda';
import { useNavigate } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { WarningRounded } from '@mui/icons-material';

import {
  hideLoginDialog,
  postLogin,
  postForgotPassword,
  displayLoginDialog
} from '../../actions/Login';
import { postMfaLogin } from '../../actions/Mfa';
import {
  postResendVerificationEmail,
  resetResendVerification
} from '../../actions/ResendVerificationEmail';

import { isValidEmail } from '../../conf/config';
import Translate from '../common/Translate';
import StandardDialog from '../common/StandardDialog';
import LoginForm from '../common/LoginForm';
import MfaEnrollment from './MfaEnrollment';
import OfflineDisabled from '../common/OfflineDisabled';
import { useNotification, useOnlineStatus } from '../../hooks';

const Login = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const authState = useSelector(state => state.login);
  const mfaVerifyState = useSelector(state => state.mfa.verify);
  const resendVerificationState = useSelector(
    state => state.resendVerificationEmail
  );
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const lockedCredentials = React.useRef({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = React.useState({
    email: '',
    password: ''
  });
  const [isServerErrorHidden, setIsServerErrorHidden] = React.useState(true);
  const [resendTimeout, setResendTimeout] = React.useState(0);
  const navigate = useNavigate();
  const { onSuccess } = useNotification();
  const isOnline = useOnlineStatus();
  const { formatMessage } = useIntl();

  const isPlainLogin =
    !authState.isMustResetMessageDisplayed &&
    !authState.isNotVerifiedMessageDisplayed;

  const serverError =
    !isServerErrorHidden && authState.error?.message
      ? formatMessage({
          id: authState.error.message,
          defaultMessage: authState.error.message
        })
      : '';

  const makeFieldChangeHandler = (field, setValue) => value => {
    setValue(value);
    setFieldErrors(prev => ({ ...prev, [field]: '' }));
    setIsServerErrorHidden(true);
  };
  const handleEmailChange = makeFieldChangeHandler('email', setEmail);
  const handlePasswordChange = makeFieldChangeHandler('password', setPassword);

  const validateEmail = () => {
    if (isEmpty(email))
      return formatMessage({ id: 'You must provide an email.' });
    if (!isValidEmail(email))
      return formatMessage({ id: 'You must provide a valid email.' });
    return '';
  };

  const validatePassword = () =>
    isEmpty(password)
      ? formatMessage({ id: 'You must provide a password.' })
      : '';

  const onLogin = event => {
    event.preventDefault();

    if (authState.isFetching || resendVerificationState.isFetching) return;

    const newFieldErrors = {
      email: isPlainLogin ? validateEmail() : '',
      password: isPlainLogin ? validatePassword() : ''
    };

    setFieldErrors(newFieldErrors);
    if (newFieldErrors.email || newFieldErrors.password) return;

    setIsServerErrorHidden(false);

    if (authState.isMustResetMessageDisplayed) {
      dispatch(
        postForgotPassword(email, msg =>
          onSuccess(formatMessage({ id: msg }, { email }))
        )
      );
    } else if (authState.isNotVerifiedMessageDisplayed) {
      if (resendTimeout > 0) return;
      dispatch(postResendVerificationEmail(email));
    } else {
      lockedCredentials.current = { email, password };
      dispatch(postLogin(email, password));
    }
  };

  const onTotpSubmit = code => {
    dispatch(
      postMfaLogin(
        lockedCredentials.current.email,
        lockedCredentials.current.password,
        code
      )
    );
  };

  const onBackToLogin = () => {
    dispatch(displayLoginDialog());
  };

  // Reset transient errors whenever the dialog (re)opens so a stale server
  // error from a previous attempt is never shown on a fresh open.
  useEffect(() => {
    if (authState.isLoginDialogDisplayed) {
      setFieldErrors({ email: '', password: '' });
      setIsServerErrorHidden(true);
    }
  }, [authState.isLoginDialogDisplayed]);

  useEffect(() => {
    if (resendVerificationState.success) {
      onSuccess(formatMessage({ id: 'Verification email sent!' }));
      dispatch(resetResendVerification());
      setResendTimeout(60);
    }
  }, [resendVerificationState.success, onSuccess, formatMessage, dispatch]);

  useEffect(() => {
    let interval = null;
    if (resendTimeout > 0) {
      interval = setInterval(() => {
        setResendTimeout(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [resendTimeout]);

  const getLoginButtonLabel = () => {
    if (authState.isMustResetMessageDisplayed) {
      return <Translate>Send reset email</Translate>;
    }
    if (authState.isNotVerifiedMessageDisplayed) {
      if (resendTimeout > 0) {
        return (
          <Translate
            id="Resend in {seconds}s"
            values={{ seconds: resendTimeout }}
          />
        );
      }
      return <Translate>Resend verification email</Translate>;
    }
    return <Translate>Log in</Translate>;
  };

  const isSubmitting =
    authState.isFetching || resendVerificationState.isFetching;

  // Logging in needs the server. Offline, submitting would fail with a network
  // error the user would read as "wrong password" — so we block it and say why.
  // Note this only affects signing IN: an existing session survives offline,
  // since the token lives in localStorage.
  const LoginButton = (
    <OfflineDisabled>
      <Button
        type="submit"
        fullWidth
        size="large"
        variant="contained"
        disabled={
          !isOnline ||
          isSubmitting ||
          (resendTimeout > 0 && authState.isNotVerifiedMessageDisplayed)
        }
        sx={{ mt: 1 }}>
        {isSubmitting ? (
          <CircularProgress size="1.75rem" color="inherit" />
        ) : (
          getLoginButtonLabel()
        )}
      </Button>
    </OfflineDisabled>
  );

  const handleCreateAccount = () => {
    navigate(`/ui/signup`);
    dispatch(hideLoginDialog());
  };

  const handleForgotPassword = () => {
    navigate(`/ui/forgotPassword`);
    dispatch(hideLoginDialog());
  };

  // Step 2b: MFA enrollment wizard — rendered inside modal
  if (authState.isMfaEnrollmentRequiredDisplayed) {
    return (
      <StandardDialog
        open={authState.isLoginDialogDisplayed}
        onClose={() => dispatch(hideLoginDialog())}
        fullScreen={isMobile}
        title={formatMessage({ id: 'mfaEnrollmentRequired' })}>
        <MfaEnrollment onBack={onBackToLogin} />
      </StandardDialog>
    );
  }

  // Step 2a: TOTP code entry for admins with MFA already active
  if (authState.isMfaRequiredDisplayed) {
    return (
      <StandardDialog
        open={authState.isLoginDialogDisplayed}
        onClose={() => dispatch(hideLoginDialog())}
        fullScreen={isMobile}
        title={formatMessage({ id: 'mfaRequired' })}>
        <LoginForm
          email={email}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          password={password}
          totpMode
          onTotpSubmit={onTotpSubmit}
          totpError={mfaVerifyState.error}
          totpIsEnrollmentTokenExpired={mfaVerifyState.isEnrollmentTokenExpired}
          totpIsLoading={mfaVerifyState.isLoading}
          onBackToLogin={onBackToLogin}
        />
      </StandardDialog>
    );
  }

  // The dialog shows the login form unless the account first needs a
  // password reset or an email verification.
  let DialogContent = (
    <>
      <LoginForm
        email={email}
        onEmailChange={handleEmailChange}
        onPasswordChange={handlePasswordChange}
        password={password}
        emailError={fieldErrors.email}
        passwordError={fieldErrors.password}
        serverError={serverError}
      />
      <Box display="flex" justifyContent="flex-end" mt={0.5}>
        <Button
          type="button"
          size="small"
          variant="text"
          onClick={handleForgotPassword}
          sx={{ textTransform: 'none' }}>
          <Translate>Forgot password?</Translate>
        </Button>
      </Box>
      {LoginButton}
      <Divider sx={{ my: 1 }} />
      <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
        <Typography variant="body2" color="text.secondary">
          <Translate>No account yet?</Translate>
        </Typography>
        <Button
          type="button"
          fullWidth
          variant="outlined"
          color="primary"
          size="large"
          onClick={handleCreateAccount}>
          <Translate>Sign up</Translate>
        </Button>
      </Box>
    </>
  );
  if (authState.isMustResetMessageDisplayed) {
    DialogContent = (
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
          variant="subtitle1"
          component="p"
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
          <Translate>An email will be sent to:</Translate>{' '}
          <b>{email || authState.notVerifiedEmail}</b>
        </Typography>
        {serverError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {serverError}
          </Alert>
        )}
        {LoginButton}
      </>
    );
  } else if (authState.isNotVerifiedMessageDisplayed) {
    DialogContent = (
      <>
        <Box
          display="flex"
          height={60}
          alignItems="center"
          justifyContent="center">
          <WarningRounded
            htmlColor="#ff9800"
            style={{ fontSize: 80, paddingBottom: 20 }}
          />
        </Box>
        <Typography
          variant="subtitle1"
          component="p"
          style={{ textAlign: 'center', paddingBottom: 5 }}>
          <Translate>Your account is not verified yet.</Translate>
        </Typography>
        <Typography
          variant="body1"
          style={{ textAlign: 'center', paddingBottom: 10 }}>
          {authState.notVerifiedContext === 'forgotPassword' ? (
            <Translate>
              You must verify your email address before you can reset your
              password.
            </Translate>
          ) : (
            <Translate>Please check your email to activate it.</Translate>
          )}
        </Typography>
        <Typography variant="body2" style={{ textAlign: 'center' }}>
          <Translate>You can request a new verification email for:</Translate>{' '}
          <b>{email || authState.notVerifiedEmail}</b>
        </Typography>
        {serverError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {serverError}
          </Alert>
        )}
        {LoginButton}
      </>
    );
  }

  return (
    <StandardDialog
      open={authState.isLoginDialogDisplayed}
      onClose={() => dispatch(hideLoginDialog())}
      fullScreen={isMobile}
      centerContentMobile={isMobile}
      title={
        <Typography variant="h5" component="span" fontWeight={600}>
          <Translate>Log in</Translate>
        </Typography>
      }>
      <form onSubmit={onLogin} noValidate>
        {DialogContent}
      </form>
    </StandardDialog>
  );
};

Login.propTypes = {};

export default Login;
