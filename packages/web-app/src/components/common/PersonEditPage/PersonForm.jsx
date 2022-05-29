import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  FormControl as MuiFormControl,
  TextField,
  IconButton,
  InputAdornment
} from '@material-ui/core';

import { Controller } from 'react-hook-form';

import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import styled from 'styled-components';
import { isEmpty, match } from 'ramda';

import { emailRegexp } from '../../../conf/Config';

import StringInput from '../Form/StringInput';

const FormControl = styled(MuiFormControl)`
  padding-bottom: ${({ theme }) => theme.spacing(4)}px;
`;

const PersonEditForm = ({ control, errors, watch, isUser }) => {
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const { formatMessage } = useIntl();

  const toggleIsPasswordVisible = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  const handleMouseDownPassword = event => {
    event.preventDefault();
  };

  const validatePwd = value => {
    if (value.length > 0 && value.length < 8) {
      return formatMessage({
        id: 'Invalid email or password.'
      });
    }
    return true;
  };
  const validateEmail = value => {
    if (value) {
      if (value.length >= 0 && isEmpty(match(emailRegexp, value))) {
        return formatMessage({
          id: 'Invalid email or password.'
        });
      }
    }
    return true;
  };

  return (
    <>
      <FormControl component="fieldset" style={{ width: '50vh' }}>
        <Controller
          name="user.name"
          control={control}
          rules={{ required: true, min: 1 }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.user?.name}
              label={formatMessage({ id: 'Name' })}
              inputRef={ref}
              helperText={errors?.user?.name?.message}
              {...field}
              onChange={e => field.onChange(e.target.value)}
              value={field.value}
            />
          )}
        />
        <Controller
          name="user.surname"
          control={control}
          rules={{ required: true, min: 1 }}
          render={({ field: { ref, ...field } }) => (
            <TextField
              fullWidth
              required
              error={!!errors?.user?.surname}
              label={formatMessage({ id: 'Surname' })}
              inputRef={ref}
              helperText={errors?.user?.surname?.message}
              {...field}
              onChange={e => field.onChange(e.target.value)}
              value={field.value}
            />
          )}
        />
        <Controller
          name="user.nickname"
          control={control}
          rules={{}}
          render={({ field: { ref, onChange, ...field } }) => (
            <TextField
              fullWidth
              error={!!errors?.user?.nickname}
              label={formatMessage({ id: 'Nickname' })}
              inputRef={ref}
              onChange={onChange}
              {...field}
            />
          )}
        />
        {isUser && (
          <>
            <Controller
              name="user.email"
              control={control}
              rules={{ validate: validateEmail }}
              render={({ field: { ref, ...field } }) => (
                <TextField
                  fullWidth
                  error={!!errors?.user?.email}
                  label={formatMessage({ id: 'New email' })}
                  inputRef={ref}
                  helperText={errors?.user?.email?.message}
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                  value={field.value}
                  type="email"
                />
              )}
            />
            <Controller
              name="user.emailConfirmation"
              control={control}
              rules={{
                validate: value =>
                  (watch('user.email') !== ''
                    ? value === watch('user.email')
                    : true) || formatMessage({ id: 'The mails do not match' })
              }}
              render={({ field: { ref, ...field } }) => (
                <TextField
                  fullWidth
                  error={!!errors?.user?.emailConfirmation}
                  label={formatMessage({ id: 'Email confirmation' })}
                  helperText={errors?.user?.emailConfirmation?.message}
                  inputRef={ref}
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                  value={field.value}
                  type="email"
                />
              )}
            />
            <Controller
              name="user.password"
              control={control}
              rules={{ validate: value => (value ? validatePwd : true) }}
              render={({ field: { ref, ...field } }) => (
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
                  valueName={formatMessage({ id: 'New password' })}
                  error={!!errors?.user?.password}
                  helperText={errors?.user?.password?.message}
                  inputRef={ref}
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                  value={field.value}
                  type={isPasswordVisible ? 'text' : 'password'}
                />
              )}
            />
            <Controller
              name="user.passwordConfirmation"
              control={control}
              rules={{
                validate: value =>
                  (watch('user.password') !== ''
                    ? value === watch('user.password')
                    : true) ||
                  formatMessage({ id: 'The passwords do not match' })
              }}
              render={({ field: { ref, ...field } }) => (
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
                  valueName={formatMessage({ id: 'Password confirmation' })}
                  error={!!errors?.user?.passwordConfirmation}
                  helperText={errors?.user?.passwordConfirmation?.message}
                  inputRef={ref}
                  {...field}
                  onChange={e => field.onChange(e.target.value)}
                  value={field.value}
                  type={isPasswordVisible ? 'text' : 'password'}
                />
              )}
            />
          </>
        )}
      </FormControl>
    </>
  );
};

PersonEditForm.propTypes = {
  control: PropTypes.shape({}).isRequired,
  errors: PropTypes.shape({
    user: PropTypes.shape({
      name: PropTypes.shape({ message: PropTypes.string }),
      surname: PropTypes.shape({ message: PropTypes.string }),
      nickname: PropTypes.shape({ message: PropTypes.string }),
      email: PropTypes.shape({ message: PropTypes.string }),
      emailConfirmation: PropTypes.shape({ message: PropTypes.string }),
      password: PropTypes.shape({ message: PropTypes.string }),
      passwordConfirmation: PropTypes.shape({ message: PropTypes.string })
    })
  }),
  watch: PropTypes.shape({}).isRequired,
  isUser: PropTypes.shape({}).isRequired
};

export default PersonEditForm;
