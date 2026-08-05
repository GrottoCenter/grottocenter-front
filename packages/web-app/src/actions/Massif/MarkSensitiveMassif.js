import fetch from 'isomorphic-fetch';
import { markMassifSensitiveUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const MARK_MASSIF_SENSITIVE_SUCCESS = 'MARK_MASSIF_SENSITIVE_SUCCESS';

const markMassifSensitiveSuccess = (massif, count) => ({
  massif,
  count,
  type: MARK_MASSIF_SENSITIVE_SUCCESS
});

export const markMassifSensitive = id => (dispatch, getState) => {
  const requestOptions = {
    method: 'POST',
    headers: getState().login.authorizationHeader
  };

  return fetch(markMassifSensitiveUrl(id), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data => dispatch(markMassifSensitiveSuccess(data.massif, data.count)))
    .catch(error => {
      if (error.isAuthError) return;
      throw error;
    });
};
