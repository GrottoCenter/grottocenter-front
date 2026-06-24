import fetch from 'isomorphic-fetch';
import { getCaveUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const FETCH_NETWORK_CAVE_DESCRIPTIONS_COUNT_SUCCESS =
  'FETCH_NETWORK_CAVE_DESCRIPTIONS_COUNT_SUCCESS';

export const fetchNetworkCaveDescriptionsCount =
  caveId => (dispatch, getState) => {
    const requestOptions = {
      headers: getState().login.authorizationHeader
    };

    return fetch(getCaveUrl + caveId, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data =>
        dispatch({
          type: FETCH_NETWORK_CAVE_DESCRIPTIONS_COUNT_SUCCESS,
          count: data.descriptions?.length ?? 0
        })
      )
      .catch(error => {
        if (error.isAuthError) return;
      });
  };
