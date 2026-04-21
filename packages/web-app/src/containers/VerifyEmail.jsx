import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { getVerifyEmail } from '../actions/VerifyEmail';
import { displayLoginDialog } from '../actions/Login';
import VerifyEmailPage from '../pages/VerifyEmail';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const verifyEmailState = useSelector(state => state.verifyEmail);
  const hasRequested = React.useRef(false);

  useEffect(() => {
    if (token && !hasRequested.current) {
      hasRequested.current = true;
      dispatch(getVerifyEmail(token));
    }
  }, [dispatch, token]);

  const invalidToken = !token && !verifyEmailState.isFetching;
  const alreadyVerified =
    verifyEmailState.success &&
    typeof verifyEmailState.message === 'string' &&
    verifyEmailState.message.toLowerCase().includes('already');

  const handleGoToLogin = () => {
    navigate('/');
    dispatch(displayLoginDialog());
  };

  return (
    <VerifyEmailPage
      loading={verifyEmailState.isFetching}
      success={verifyEmailState.success}
      alreadyVerified={alreadyVerified}
      invalidToken={invalidToken}
      error={verifyEmailState.error ? verifyEmailState.error.message : null}
      onGoToLogin={handleGoToLogin}
    />
  );
};

export default VerifyEmail;
