import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import { useLocation } from 'react-router-dom';
import { isPasswordValid } from '../../conf/config';
import { postChangePassword } from '../../actions/Person/ChangePassword';
import { logout } from '../../actions/Login';
import { useNotification } from '../../hooks';
import ChangePasswordForm from '../../pages/ChangePasswordForm';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const changePasswordState = useSelector(state => state.changePassword);
  const [changePasswordRequestSent, setChangePasswordRequestSent] =
    useState(false);
  const [changePasswordRequestSucceeded, setChangePasswordRequestSucceeded] =
    useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const { onError } = useNotification();

  const token = new URLSearchParams(useLocation().search).get('token'); // get ?token= parameter in url

  /**
   * Display error notifications if some values are incorrect.
   * Return true if all values are valid, else false.
   */
  const checkIfValuesAreValid = () => {
    const errors = [];
    if (password !== passwordConfirmation) {
      errors.push(formatMessage({ id: 'The passwords must match.' }));
    }
    if (!isPasswordValid(password)) {
      errors.push(formatMessage({ id: 'password.rules.error' }));
    }

    if (errors.length > 0) {
      errors.map(e => onError(e));
      return false;
    }
    return true;
  };

  const onChangePassword = event => {
    event.preventDefault();
    if (checkIfValuesAreValid()) {
      dispatch(postChangePassword(password, token));
      setChangePasswordRequestSent(true);
    }
  };

  useEffect(() => {
    if (
      changePasswordState.error === null &&
      !changePasswordState.isFetching &&
      changePasswordRequestSent
    ) {
      dispatch(logout());
      setChangePasswordRequestSucceeded(true);
    } else {
      setChangePasswordRequestSucceeded(false);
    }
  }, [changePasswordState, changePasswordRequestSent, dispatch]);

  return (
    <ChangePasswordForm
      loading={changePasswordState.isFetching}
      password={password}
      passwordConfirmation={passwordConfirmation}
      onPasswordChange={setPassword}
      onPasswordConfirmationChange={setPasswordConfirmation}
      onChangePassword={onChangePassword}
      changePasswordRequestSucceeded={changePasswordRequestSucceeded}
    />
  );
};

ChangePassword.propTypes = {};

export default ChangePassword;
