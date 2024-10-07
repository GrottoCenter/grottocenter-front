import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { isEmpty, match } from 'ramda';

import { useNavigate } from 'react-router-dom';
import { emailRegexp } from '../../conf/config';
import { postForgotPassword } from '../../actions/ForgotPassword';
import { useBoolean, useNotification, usePermissions } from '../../hooks';
import ForgotPasswordPage from '../../pages/ForgotPassword';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const forgotPasswordState = useSelector(state => state.forgotPassword);
  const { isTrue: isRequestSent, true: requestSent } = useBoolean();
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
    if (isEmpty(match(emailRegexp, email))) {
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
      dispatch(
        postForgotPassword({
          email
        })
      );
      requestSent();
    }
  };

  useEffect(() => {
    if (
      forgotPasswordState.error === null &&
      !forgotPasswordState.isFetching &&
      isRequestSent
    ) {
      requestSucceeded();
    } else {
      requestFailed();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forgotPasswordState, isRequestSent]);

  return (
    <ForgotPasswordPage
      loading={forgotPasswordState.isFetching}
      email={email}
      onEmailChange={setEmail}
      onForgotPassword={onForgotPassword}
      forgotPasswordRequestSucceeded={isRequestSucceeded}
    />
  );
};

ForgotPassword.propTypes = {};

export default ForgotPassword;
