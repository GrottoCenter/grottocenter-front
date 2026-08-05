import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Typography
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { styled } from '@mui/material/styles';
import { Turnstile } from '@marsidev/react-turnstile';
import { isPasswordValid, isValidEmail } from '../../conf/config';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import StringInput from '../../components/common/Form/StringInput';
import PasswordRules from '../../components/common/Form/PasswordRules';

const FormWrapper = styled('form')`
  display: flex;
  flex-direction: column;
  margin: auto;
  margin-bottom: 0;
  max-width: 500px;
`;

const SpacedCenteredButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(0.5)} auto;
`;

const HoneypotWrapper = styled('div')`
  position: absolute;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
`;

const CaptchaWrapper = styled('div')`
  display: flex;
  justify-content: center;
  margin: ${({ theme }) => theme.spacing(1)} auto;
`;

const SignUpForm = ({
  email,
  name,
  nickname,
  password,
  passwordConfirmation,
  surname,
  honeypot,
  captchaSiteKey = undefined,
  isSubmitDisabled = false,
  onEmailChange,
  onNameChange,
  onNicknameChange,
  onPasswordChange,
  onPasswordConfirmationChange,
  onSignUp,
  onSurnameChange,
  onHoneypotChange,
  onCaptchaTokenChange,
  loading,
  signUpRequestSucceeded
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const { formatMessage } = useIntl();

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  const checkIfHasError = fieldName => {
    switch (fieldName) {
      case 'nickname':
        return nickname.trim() === '';
      case 'email':
        return !isValidEmail(email);
      case 'password':
        return !isPasswordValid(password);
      case 'passwordConfirmation':
        return password !== passwordConfirmation;

      default:
        return false;
    }
  };

  return (
    <Layout
      title={formatMessage({ id: 'Join Grottocenter' })}
      content={
        signUpRequestSucceeded ? (
          <Typography align="center">
            {formatMessage({
              id: 'Your account has been successfully created!'
            })}
            {'\n'}
            {formatMessage(
              {
                id: 'An email has been sent to {email} to verify your account. Please click the link in the email to activate your account.'
              },
              { email }
            )}
          </Typography>
        ) : (
          <FormWrapper onSubmit={onSignUp}>
            <StringInput
              fullWidth
              hasError={checkIfHasError('nickname')}
              helperText={formatMessage({
                id: 'The nickname defines how other users see you.'
              })}
              onValueChange={onNicknameChange}
              required
              value={nickname}
              valueName={formatMessage({ id: 'Nickname' })}
            />
            <StringInput
              fullWidth
              helperText={formatMessage({
                id: 'Your real name (optional).'
              })}
              onValueChange={onNameChange}
              value={name}
              valueName={formatMessage({ id: 'Caver.Name' })}
            />
            <StringInput
              fullWidth
              helperText={formatMessage({
                id: 'Your real surname (optional).'
              })}
              onValueChange={onSurnameChange}
              value={surname}
              valueName={formatMessage({ id: 'Surname' })}
            />

            <StringInput
              fullWidth
              hasError={checkIfHasError('email')}
              onValueChange={onEmailChange}
              required
              value={email}
              valueName={formatMessage({ id: 'Email' })}
            />

            <StringInput
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={formatMessage({
                      id: 'toggle password visibility'
                    })}
                    onClick={toggleIsPasswordVisible}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="large">
                    {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
              fullWidth
              hasError={checkIfHasError('password')}
              onValueChange={onPasswordChange}
              required
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              valueName={formatMessage({ id: 'Password' })}
            />
            <PasswordRules password={password} />

            <StringInput
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label={formatMessage({
                      id: 'toggle password visibility'
                    })}
                    onClick={toggleIsPasswordVisible}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                    size="large">
                    {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
              hasError={checkIfHasError('passwordConfirmation')}
              helperText={formatMessage({ id: 'Repeat your password here.' })}
              fullWidth
              onValueChange={onPasswordConfirmationChange}
              required
              type={isPasswordVisible ? 'text' : 'password'}
              value={passwordConfirmation}
              valueName={formatMessage({ id: 'Password confirmation' })}
            />

            {/*
              Honeypot: an invisible field bots tend to fill. The wrapper is
              aria-hidden so assistive tech skips it; the input keeps a
              plausible name/aria-label ("Website") — deliberately not
              translated, since the audience is bots, not users.
            */}
            <HoneypotWrapper aria-hidden="true">
              <input
                id="signup-website"
                type="text"
                name="website"
                aria-label="Website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={e => onHoneypotChange(e.target.value)}
              />
            </HoneypotWrapper>

            {captchaSiteKey && (
              <CaptchaWrapper>
                <Turnstile
                  siteKey={captchaSiteKey}
                  onSuccess={onCaptchaTokenChange}
                  onExpire={() => onCaptchaTokenChange('')}
                  onError={() => onCaptchaTokenChange('')}
                  options={{ theme: 'auto' }}
                />
              </CaptchaWrapper>
            )}

            <SpacedCenteredButton
              type="submit"
              size="large"
              disabled={loading || isSubmitDisabled}
              color={loading ? 'inherit' : 'primary'}>
              {loading ? (
                <CircularProgress size="1.75rem" />
              ) : (
                formatMessage({ id: 'Sign up' })
              )}
            </SpacedCenteredButton>
          </FormWrapper>
        )
      }
    />
  );
};

SignUpForm.propTypes = {
  email: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  nickname: PropTypes.string.isRequired,
  password: PropTypes.string.isRequired,
  passwordConfirmation: PropTypes.string.isRequired,
  surname: PropTypes.string.isRequired,
  honeypot: PropTypes.string.isRequired,
  captchaSiteKey: PropTypes.string,
  isSubmitDisabled: PropTypes.bool,
  onEmailChange: PropTypes.func.isRequired,
  onSignUp: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onNicknameChange: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onPasswordConfirmationChange: PropTypes.func.isRequired,
  onSurnameChange: PropTypes.func.isRequired,
  onHoneypotChange: PropTypes.func.isRequired,
  onCaptchaTokenChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  signUpRequestSucceeded: PropTypes.bool.isRequired
};

export default SignUpForm;
