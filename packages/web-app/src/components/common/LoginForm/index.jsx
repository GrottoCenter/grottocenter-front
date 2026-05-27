import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  FilledInput,
  InputAdornment,
  IconButton,
  Fade,
  Typography
} from '@mui/material';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { styled } from '@mui/material/styles';

const FormWrapper = styled('form')`
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
`;

// ─── TOTP step ────────────────────────────────────────────────────────────────

const TotpStep = ({
  onTotpSubmit,
  totpError,
  isEnrollmentTokenExpired,
  onBackToLogin,
  isLoading
}) => {
  const { formatMessage } = useIntl();
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    if (totpError) setCode('');
  }, [totpError]);

  const normalizeOtp = raw =>
    raw
      .replace(/[\s-]/g, '')
      // normalize full-width digits (iOS: １２３ → 123)
      .replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
      .replace(/\D/g, '')
      .slice(0, 6);

  const handleChange = event => {
    const value = normalizeOtp(event.target.value);
    setCode(value);
    if (value.length === 6) onTotpSubmit(value);
  };

  const handlePaste = event => {
    event.preventDefault();
    const value = normalizeOtp(event.clipboardData.getData('text'));
    setCode(value);
    if (value.length === 6) onTotpSubmit(value);
  };

  const errorMessage = () => {
    if (isEnrollmentTokenExpired)
      return formatMessage({ id: 'mfaEnrollmentTokenExpired' });
    if (totpError === 'TotpAlreadyUsed')
      return formatMessage({ id: 'mfaAlreadyUsedCode' });
    if (totpError) return formatMessage({ id: 'mfaInvalidCode' });
    return null;
  };

  const msg = errorMessage();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Typography variant="body2" color="text.secondary" textAlign="center">
        {formatMessage({ id: 'mfaEnrollmentStep3Body' })}
      </Typography>

      <FormControl variant="filled">
        <InputLabel htmlFor="totp-code-input">
          {formatMessage({ id: 'mfaCodeLabel' })}
        </InputLabel>
        <FilledInput
          id="totp-code-input"
          value={code}
          onChange={handleChange}
          onPaste={handlePaste}
          inputProps={{
            inputMode: 'numeric',
            maxLength: 6,
            autoComplete: 'one-time-code',
            'aria-label': formatMessage({ id: 'mfaCodeLabel' })
          }}
          autoFocus
          disabled={isLoading}
        />
      </FormControl>

      {msg && (
        <Fade in>
          <Alert
            severity={isEnrollmentTokenExpired ? 'warning' : 'error'}
            action={
              isEnrollmentTokenExpired ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={onBackToLogin}>
                  {formatMessage({ id: 'mfaEnrollmentTokenExpiredAction' })}
                </Button>
              ) : null
            }>
            {msg}
          </Alert>
        </Fade>
      )}

      <Button
        size="small"
        variant="text"
        startIcon={<ArrowBackIcon />}
        onClick={onBackToLogin}
        sx={{ alignSelf: 'flex-start' }}>
        {formatMessage({ id: 'Cancel' })}
      </Button>
    </Box>
  );
};

TotpStep.propTypes = {
  onTotpSubmit: PropTypes.func.isRequired,
  totpError: PropTypes.string,
  isEnrollmentTokenExpired: PropTypes.bool,
  onBackToLogin: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

// ─── Login form ───────────────────────────────────────────────────────────────

const LoginForm = ({
  email,
  onEmailChange,
  password,
  onPasswordChange,
  authErrors,
  totpMode,
  onTotpSubmit,
  totpError,
  totpIsEnrollmentTokenExpired,
  totpIsLoading,
  onBackToLogin
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const { formatMessage } = useIntl();

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  const handleEmailChange = event => {
    onEmailChange(event.target.value);
  };
  const handlePasswordChange = event => {
    onPasswordChange(event.target.value);
  };

  if (totpMode) {
    return (
      <TotpStep
        onTotpSubmit={onTotpSubmit}
        totpError={totpError}
        isEnrollmentTokenExpired={totpIsEnrollmentTokenExpired}
        onBackToLogin={onBackToLogin}
        isLoading={totpIsLoading}
      />
    );
  }

  return (
    <FormWrapper>
      <FormControl variant="filled">
        <InputLabel htmlFor="input-with-icon-adornment">
          {formatMessage({ id: 'Email' })}
        </InputLabel>
        <FilledInput
          name="email"
          value={email}
          onChange={handleEmailChange}
          required
          type="email"
        />
      </FormControl>

      <FormControl variant="filled">
        <InputLabel htmlFor="filled-adornment-password">
          {formatMessage({ id: 'Password' })}
        </InputLabel>
        <FilledInput
          name="password"
          type={isPasswordVisible ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label={formatMessage({ id: 'toggle password visibility' })}
                onClick={toggleIsPasswordVisible}
                onMouseDown={handleMouseDownPassword}
                edge="end"
                size="large">
                {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          }
          required
        />
      </FormControl>

      {authErrors.length > 0 && (
        <FormControl>
          {authErrors.map(error => (
            <Fade in={authErrors.length > 0} key={error}>
              <Alert severity="error" sx={{ mt: 1 }}>
                {formatMessage({ id: error })}
              </Alert>
            </Fade>
          ))}
        </FormControl>
      )}
    </FormWrapper>
  );
};

LoginForm.propTypes = {
  authErrors: PropTypes.arrayOf(PropTypes.string).isRequired,
  email: PropTypes.string.isRequired,
  onEmailChange: PropTypes.func.isRequired,
  onBackToLogin: PropTypes.func,
  onTotpSubmit: PropTypes.func,
  password: PropTypes.string.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  totpError: PropTypes.string,
  totpIsEnrollmentTokenExpired: PropTypes.bool,
  totpIsLoading: PropTypes.bool,
  totpMode: PropTypes.bool
};

export default LoginForm;
