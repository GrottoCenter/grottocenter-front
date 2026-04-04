import fetch from 'isomorphic-fetch';
import { getMassifUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_MASSIF = 'FETCH_MASSIF';
export const FETCH_MASSIF_SUCCESS = 'FETCH_MASSIF_SUCCESS';
export const FETCH_MASSIF_FAILURE = 'FETCH_MASSIF_FAILURE';

const fetchMassif = () => ({
  type: FETCH_MASSIF
});

const fetchMassifSuccess = massif => ({
  type: FETCH_MASSIF_SUCCESS,
  massif
});

const fetchMassifFailure = error => ({
  type: FETCH_MASSIF_FAILURE,
  error
});

export function loadMassif(massifId) {
  return (dispatch, getState) => {
    dispatch(fetchMassif());

    const requestOptions = {
      headers: getState().login.authorizationHeader
    };

    return fetch(getMassifUrl + massifId, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(fetchMassifSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(fetchMassifFailure(error));
      });
  };
}
