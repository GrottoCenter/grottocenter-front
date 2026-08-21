import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { isValidEmail } from '../../conf/config';
import {
  useBoolean,
  useForgotPassword,
  useNotification,
  usePermissions
} from '../../hooks';
import ForgotPasswordPage from '../../pages/ForgotPassword';

const ForgotPassword = () => {
  const { formatMessage } = useIntl();
  const forgotPasswordMutation = useForgotPassword();
  const {
    isTrue: isRequestSucceeded,
    true: requestSucceeded,
    false: requestFailed
  } = useBoolean();
  const [email, setEmail] = React.useState('');
  const { onError } = useNotification();
  const permissions = usePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (permissions.isAuth) {
      navigate(``);
    }
  }, [navigate, permissions.isAuth]);

  const checkIfValuesAreValid = () => {
    const errors = [];
    if (!isValidEmail(email)) {
      errors.push(formatMessage({ id: 'The email must be valid.' }));
    }

    if (errors.length > 0) {
      errors.map(e => onError(e));
      return false;
    }
    return true;
  };

  const onForgotPassword = event => {
    event.preventDefault();
    if (checkIfValuesAreValid()) {
      forgotPasswordMutation.mutate({ email });
    }
  };

  const isForgotSuccess = forgotPasswordMutation.isSuccess;
  useEffect(() => {
    if (isForgotSuccess) requestSucceeded();
    else requestFailed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForgotSuccess]);

  return (
    <ForgotPasswordPage
      loading={forgotPasswordMutation.isPending}
      email={email}
      onEmailChange={setEmail}
      onForgotPassword={onForgotPassword}
      forgotPasswordRequestSucceeded={isRequestSucceeded}
    />
  );
};

ForgotPassword.propTypes = {};

export default ForgotPassword;
