import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';

import { useLocation } from 'react-router-dom';
import { isPasswordValid } from '../../conf/config';
import { useChangePassword, useNotification } from '../../hooks';
import { logout } from '../../actions/Login';
import ChangePasswordForm from '../../pages/ChangePasswordForm';

const ChangePassword = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const changePasswordMutation = useChangePassword();
  const [changePasswordRequestSucceeded, setChangePasswordRequestSucceeded] =
    useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
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
    if (!token && !currentPassword) {
      errors.push(
        formatMessage({ id: 'You must provide your current password.' })
      );
    }
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
      changePasswordMutation.mutate({ password, token, currentPassword });
    }
  };

  useEffect(() => {
    if (!changePasswordMutation.isSuccess) return;
    dispatch(logout());
    setChangePasswordRequestSucceeded(true);
  }, [changePasswordMutation.isSuccess, dispatch]);

  return (
    <ChangePasswordForm
      loading={changePasswordMutation.isPending}
      currentPassword={token ? undefined : currentPassword}
      onCurrentPasswordChange={token ? undefined : setCurrentPassword}
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
