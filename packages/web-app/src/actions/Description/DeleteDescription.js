import fetch from 'isomorphic-fetch';
import { deleteDescriptionUrl } from '../../conf/apiRoutes';
import { checkAndGetStatus } from '../utils';

export const DELETE_DESCRIPTION = 'DELETE_DESCRIPTION';
export const DELETE_DESCRIPTION_SUCCESS = 'DELETE_DESCRIPTION_SUCCESS';
export const DELETE_DESCRIPTION_PERMANENT_SUCCESS =
  'DELETE_DESCRIPTION_PERMANENT_SUCCESS';
export const DELETE_DESCRIPTION_FAILURE = 'DELETE_DESCRIPTION_FAILURE';

const deleteDescriptionAction = () => ({
  type: DELETE_DESCRIPTION
});

const deleteDescriptionSuccess = (description, isPermanent) => ({
  type: isPermanent
    ? DELETE_DESCRIPTION_PERMANENT_SUCCESS
    : DELETE_DESCRIPTION_SUCCESS,
  description
});

const deleteDescriptionFailure = error => ({
  type: DELETE_DESCRIPTION_FAILURE,
  error
});

export const deleteDescription =
  ({ id, isPermanent }) =>
  (dispatch, getState) => {
    dispatch(deleteDescriptionAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteDescriptionUrl(id, isPermanent), requestOptions)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(deleteDescriptionSuccess(data, isPermanent)))
      .catch(errorMessage => {
        dispatch(deleteDescriptionFailure(errorMessage));
      });
  };
