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
  const onBeforeNavigateRef = useRef(onBeforeNavigate);
  onBeforeNavigateRef.current = onBeforeNavigate;

  useEffect(() => {
    if (isAuth && waitingForAuth.current) {
      waitingForAuth.current = false;
      onBeforeNavigateRef.current?.();
      navigate(to);
    }
  }, [isAuth, navigate, to]);

  return () => {
    if (isAuth) {
      onBeforeNavigateRef.current?.();
      navigate(to);
    } else {
      waitingForAuth.current = true;
      dispatch(displayLoginDialog());
    }
  };
};
