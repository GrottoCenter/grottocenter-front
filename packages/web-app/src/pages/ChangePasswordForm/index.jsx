import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
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

import { isPasswordValid } from '../../conf/config';
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

const ChangePasswordForm = ({
  currentPassword = undefined,
  onCurrentPasswordChange = undefined,
  password,
  passwordConfirmation,
  onPasswordChange,
  onPasswordConfirmationChange,
  onChangePassword,
  loading,
  changePasswordRequestSucceeded
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  const checkIfHasError = fieldName => {
    switch (fieldName) {
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
      title={formatMessage({ id: 'Update password' })}
      content={
        changePasswordRequestSucceeded ? (
          <>
            <Typography align="center">
              {formatMessage({
                id: 'Your password has been successfully updated!'
              })}{' '}
              {formatMessage({
                id: 'You can now log in to Grottocenter using your new password.'
              })}
            </Typography>
            <SpacedCenteredButton
              color="primary"
              onClick={() => navigate('/ui/login')}
              style={{ display: 'block' }}
              variant="contained">
              {formatMessage({ id: 'Log in' })}
            </SpacedCenteredButton>
          </>
        ) : (
          <FormWrapper onSubmit={onChangePassword}>
            {onCurrentPasswordChange !== undefined && (
              <StringInput
                fullWidth
                onValueChange={onCurrentPasswordChange}
                required
                type="password"
                value={currentPassword}
                valueName={formatMessage({ id: 'Current password' })}
              />
            )}
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
            <SpacedCenteredButton
              type="submit"
              size="large"
              color={loading ? 'inherit' : 'primary'}>
              {loading ? (
                <CircularProgress size="2.8rem" />
              ) : (
                formatMessage({ id: 'Update password' })
              )}
            </SpacedCenteredButton>
          </FormWrapper>
        )
      }
    />
  );
};

ChangePasswordForm.propTypes = {
  changePasswordRequestSucceeded: PropTypes.bool.isRequired,
  currentPassword: PropTypes.string,
  loading: PropTypes.bool.isRequired,
  onChangePassword: PropTypes.func.isRequired,
  onCurrentPasswordChange: PropTypes.func,
  onPasswordChange: PropTypes.func.isRequired,
  onPasswordConfirmationChange: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  passwordConfirmation: PropTypes.string.isRequired
};


export default ChangePasswordForm;
