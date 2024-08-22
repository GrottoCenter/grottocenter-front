import fetch from 'isomorphic-fetch';
import { restoreDescriptionUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const RESTORE_DESCRIPTION = 'RESTORE_DESCRIPTION';
export const RESTORE_DESCRIPTION_SUCCESS = 'RESTORE_DESCRIPTION_SUCCESS';
export const RESTORE_DESCRIPTION_FAILURE = 'RESTORE_DESCRIPTION_FAILURE';

const restoreDescriptionAction = () => ({
  type: RESTORE_DESCRIPTION
});

const restoreDescriptionSuccess = description => ({
  type: RESTORE_DESCRIPTION_SUCCESS,
  description
});

const restoreDescriptionFailure = error => ({
  type: RESTORE_DESCRIPTION_FAILURE,
  error
});

export const restoreDescription =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreDescriptionAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreDescriptionUrl(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(restoreDescriptionSuccess(data)))
      .catch(errorMessage => {
        dispatch(restoreDescriptionFailure(errorMessage));
      });
  };
