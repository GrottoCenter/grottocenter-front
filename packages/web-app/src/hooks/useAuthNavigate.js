import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { usePermissions } from './usePermissions';
import { displayLoginDialog } from '../actions/Login';

export const useAuthNavigate = (to, { onBeforeNavigate } = {}) => {
  const { isAuth } = usePermissions();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const waitingForAuth = useRef(false);

  useEffect(() => {
    if (isAuth && waitingForAuth.current) {
      waitingForAuth.current = false;
      onBeforeNavigate?.();
      navigate(to);
    }
  }, [isAuth, navigate, to, onBeforeNavigate]);

  return () => {
    if (isAuth) {
      onBeforeNavigate?.();
      navigate(to);
    } else {
      waitingForAuth.current = true;
      dispatch(displayLoginDialog());
    }
  };
};
