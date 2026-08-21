import { useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';

import { useVerifyEmail } from '../hooks';
import { displayLoginDialog } from '../actions/Login';
import VerifyEmailPage from '../pages/VerifyEmail';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isFetching, data, error } = useVerifyEmail(token);

  const invalidToken = !token && !isFetching;
  const success = !!data;
  const message = typeof data?.message === 'string' ? data.message : null;
  const alreadyVerified =
    success && message !== null && message.toLowerCase().includes('already');

  const handleGoToLogin = () => {
    navigate('/');
    dispatch(displayLoginDialog());
  };

  return (
    <VerifyEmailPage
      loading={isFetching}
      success={success}
      alreadyVerified={alreadyVerified}
      invalidToken={invalidToken}
      error={error ? (error.body?.message ?? error.message) : null}
      onGoToLogin={handleGoToLogin}
    />
  );
};

export default VerifyEmail;
