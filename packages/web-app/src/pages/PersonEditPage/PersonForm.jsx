// import React, { useState } from 'react';
import React from 'react';
import PropTypes from 'prop-types';
// import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router-dom';
import { Controller } from 'react-hook-form';
import {
  Button,
  TextField,
  CircularProgress,
  IconButton,
  InputAdornment,
  Typography
} from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';
import { isEmpty, match } from 'ramda';

import { emailRegexp, PASSWORD_MIN_LENGTH } from '../../conf/Config';
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

const PersonEditForm = ({
  control,
  errors,
  user,
  onEmailChange,
  onNameChange,
  onNicknameChange,
  onPasswordChange,
  onPasswordConfirmationChange,
  onPersonEdit,
  onSurnameChange,
  loading,
  PersonEditRequestSucceeded
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const { formatMessage } = useIntl();
  const history = useHistory();
  // const [User, setUser] = useState(null);

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  const checkIfHasError = fieldName => {
    switch (fieldName) {
      case 'email':
        return isEmpty(match(emailRegexp, user.email));
      case 'password':
      case 'passwordConfirmation':
        return (
          user.password < PASSWORD_MIN_LENGTH ||
          user.password !== user.passwordConfirmation
        );

      default:
        return false;
    }
  };

  return (
    <Layout
      title={formatMessage({ id: 'Edit your profile' })}
      footer=""
      content={
        <>
          {!PersonEditRequestSucceeded ? (
            <>
              <Typography align="center">
                {formatMessage({
                  id: 'Your profile has been successfully edited!'
                })}{' '}
              </Typography>
              <SpacedCenteredButton
                color="primary"
                onClick={() => history.push('/')}
                style={{ display: 'block' }}
                variant="contained">
                {formatMessage({ id: 'Edit' })}
              </SpacedCenteredButton>
            </>
          ) : (
            <FormWrapper onSubmit={onPersonEdit}>
              <StringInput
                fullWidth
                helperText={formatMessage({
                  id: 'The nickname defines how other users see you.'
                })}
                onValueChange={onNicknameChange}
                required
                value={user.nickname}
                valueName={formatMessage({ id: 'Nickname' })}
              />
              <Controller
                name="user.name"
                control={control}
                rules={{ required: true }}
                render={({ field: { ref, onChange, ...field } }) => (
                  <TextField
                    fullWidth
                    required
                    error={!!errors?.user?.name}
                    label={formatMessage({ id: 'User name' })}
                    value={errors.user.name}
                    inputRef={ref}
                    onChange={onChange}
                    {...field}
                  />
                )}
              />
              <StringInput
                fullWidth
                helperText={formatMessage({
                  id: 'Your real name (optional).'
                })}
                onValueChange={onNameChange}
                value={user.name}
                valueName={formatMessage({ id: 'Name' })}
              />
              <StringInput
                fullWidth
                helperText={formatMessage({
                  id: 'Your real surname (optional).'
                })}
                onValueChange={onSurnameChange}
                value={user.surname}
                valueName={formatMessage({ id: 'Surname' })}
              />

              <StringInput
                fullWidth
                hasError={checkIfHasError('email')}
                onValueChange={onEmailChange}
                required
                value={user.email}
                valueName={formatMessage({ id: 'Email' })}
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
                value={user.password}
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
                value={user.passwordConfirmation}
                valueName={formatMessage({ id: 'Password confirmation' })}
              />
              <SpacedCenteredButton
                type="submit"
                size="large"
                color={loading ? 'default' : 'primary'}>
                {loading ? (
                  <CircularProgress size="2.8rem" />
                ) : (
                  formatMessage({ id: 'Edit' })
                )}
              </SpacedCenteredButton>
            </FormWrapper>
          )}
        </>
      }
    />
  );
};

PersonEditForm.propTypes = {
  control: PropTypes.shape({}),
  errors: PropTypes.shape({
    user: PropTypes.shape({
      email: PropTypes.arrayOf(PropTypes.shape({})),
      name: PropTypes.arrayOf(PropTypes.shape({})),
      language: PropTypes.shape({ message: PropTypes.string }),
      surname: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  user: PropTypes.shape({
    email: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    nickname: PropTypes.string.isRequired,
    password: PropTypes.string.isRequired,
    passwordConfirmation: PropTypes.string.isRequired,
    surname: PropTypes.string.isRequired
  }),
  onEmailChange: PropTypes.func.isRequired,
  onPersonEdit: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onNicknameChange: PropTypes.func.isRequired,
  onPasswordChange: PropTypes.func.isRequired,
  onPasswordConfirmationChange: PropTypes.func.isRequired,
  onSurnameChange: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  PersonEditRequestSucceeded: PropTypes.bool.isRequired
};

export default PersonEditForm;
