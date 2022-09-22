import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import {
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Typography
} from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';

import { PASSWORD_MIN_LENGTH } from '../../conf/config';
import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import StringInput from '../../components/common/Form/StringInput';

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  margin: auto;
  margin-bottom: 0;
  max-width: 500px;
`;

const SpacedCenteredButton = styled(Button)`
  margin: ${({ theme }) => theme.spacing(1)}px auto;
`;

const ChangePasswordForm = ({
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
  const history = useHistory();

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  const checkIfHasError = fieldName => {
    switch (fieldName) {
      case 'password':
      case 'passwordConfirmation':
        return (
          password < PASSWORD_MIN_LENGTH || password !== passwordConfirmation
        );

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
                id:
                  'You can now log in to Grottocenter using your new password.'
              })}
            </Typography>
            <SpacedCenteredButton
              color="primary"
              onClick={() => history.push('/ui/login')}
              style={{ display: 'block' }}
              variant="contained">
              {formatMessage({ id: 'Log in' })}
            </SpacedCenteredButton>
          </>
        ) : (
          <FormWrapper onSubmit={onChangePassword}>
            <StringInput
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleIsPasswordVisible}
                    onMouseDown={handleMouseDownPassword}
                    edge="end">
                    {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
              fullWidth
              hasError={checkIfHasError('password')}
              helperText={formatMessage(
                {
                  id: `password.length.error`,
                  defaultMessage: `Your password must be at least {passwordMinLength} characters.`,
                  description:
                    'Error displayed when the account password is too short.'
                },
                {
                  passwordMinLength: PASSWORD_MIN_LENGTH
                }
              )}
              onValueChange={onPasswordChange}
              required
              type={isPasswordVisible ? 'text' : 'password'}
              value={password}
              valueName={formatMessage({ id: 'Password' })}
            />

            <StringInput
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={toggleIsPasswordVisible}
                    onMouseDown={handleMouseDownPassword}
                    edge="end">
                    {isPasswordVisible ? <Visibility /> : <VisibilityOff />}
                  </IconButton>
                </InputAdornment>
              }
              hasError={checkIfHasError('passwordConfirmation')}
              helperText="Repeat your password here."
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
              color={loading ? 'default' : 'primary'}>
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
  loading: PropTypes.bool.isRequired,
  onChangePassword: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onPasswordConfirmationChange: PropTypes.func.isRequired,
  password: PropTypes.string.isRequired,
  passwordConfirmation: PropTypes.string.isRequired
};

export default ChangePasswordForm;
