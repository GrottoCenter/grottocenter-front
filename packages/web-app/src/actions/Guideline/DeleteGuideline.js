import fetch from 'isomorphic-fetch';
import { deleteGuidelineUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const DELETE_GUIDELINE = 'DELETE_GUIDELINE';
export const DELETE_GUIDELINE_SUCCESS = 'DELETE_GUIDELINE_SUCCESS';
export const DELETE_GUIDELINE_FAILURE = 'DELETE_GUIDELINE_FAILURE';

export const deleteGuidelineAction = () => ({
  type: DELETE_GUIDELINE
});

export const deleteGuidelineSuccess = guideline => ({
  type: DELETE_GUIDELINE_SUCCESS,
  guideline
});

export const deleteGuidelineFailure = error => ({
  type: DELETE_GUIDELINE_FAILURE,
  error
});

export const deleteGuideline =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(deleteGuidelineAction());

    const requestOptions = {
      method: 'DELETE',
      headers: getState().login.authorizationHeader
    };

    return fetch(deleteGuidelineUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(deleteGuidelineSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          deleteGuidelineFailure(
            makeErrorMessage(error.message, `Deleting guideline`),
            error.message
          )
        );
      });
  };
