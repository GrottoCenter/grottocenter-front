import fetch from 'isomorphic-fetch';
import { banCaverUrl, unbanCaverUrl } from '../../conf/apiRoutes';
import { checkAuthStatus } from '../utils';

export const POST_BAN_CAVER = 'POST_BAN_CAVER';
export const POST_BAN_CAVER_SUCCESS = 'POST_BAN_CAVER_SUCCESS';
export const POST_BAN_CAVER_FAILURE = 'POST_BAN_CAVER_FAILURE';

export const POST_UNBAN_CAVER = 'POST_UNBAN_CAVER';
export const POST_UNBAN_CAVER_SUCCESS = 'POST_UNBAN_CAVER_SUCCESS';
export const POST_UNBAN_CAVER_FAILURE = 'POST_UNBAN_CAVER_FAILURE';

const postBanCaverAction = () => ({ type: POST_BAN_CAVER });
const postBanCaverActionSuccess = () => ({
  type: POST_BAN_CAVER_SUCCESS
});
const postBanCaverActionFailure = error => ({
  type: POST_BAN_CAVER_FAILURE,
  error
});

const postUnbanCaverAction = () => ({ type: POST_UNBAN_CAVER });
const postUnbanCaverActionSuccess = () => ({
  type: POST_UNBAN_CAVER_SUCCESS
});
const postUnbanCaverActionFailure = error => ({
  type: POST_UNBAN_CAVER_FAILURE,
  error
});

export function postBanCaver(caverId) {
  return (dispatch, getState) => {
    dispatch(postBanCaverAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(banCaverUrl(caverId), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(() => dispatch(postBanCaverActionSuccess()))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(postBanCaverActionFailure(error));
      });
  };
}

export function postUnbanCaver(caverId) {
  return (dispatch, getState) => {
    dispatch(postUnbanCaverAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(unbanCaverUrl(caverId), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(() => dispatch(postUnbanCaverActionSuccess()))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(postUnbanCaverActionFailure(error));
      });
  };
}
