import fetch from 'isomorphic-fetch';
import { unmarkMassifSensitiveUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const UNMARK_MASSIF_SENSITIVE_SUCCESS =
  'UNMARK_MASSIF_SENSITIVE_SUCCESS';

const unmarkMassifSensitiveSuccess = (massif, count) => ({
  massif,
  count,
  type: UNMARK_MASSIF_SENSITIVE_SUCCESS
});

export const unmarkMassifSensitive = id => (dispatch, getState) => {
  const requestOptions = {
    method: 'POST',
    headers: getState().login.authorizationHeader
  };

  return fetch(unmarkMassifSensitiveUrl(id), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(data =>
      dispatch(unmarkMassifSensitiveSuccess(data.massif, data.count))
    )
    .catch(error => {
      if (error.isAuthError) return;
      throw error;
    });
};
