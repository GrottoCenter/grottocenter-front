import fetch from 'isomorphic-fetch';
import { restoreGuidelineUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const RESTORE_GUIDELINE = 'RESTORE_GUIDELINE';
export const RESTORE_GUIDELINE_SUCCESS = 'RESTORE_GUIDELINE_SUCCESS';
export const RESTORE_GUIDELINE_FAILURE = 'RESTORE_GUIDELINE_FAILURE';

export const restoreGuidelineAction = () => ({
  type: RESTORE_GUIDELINE
});

export const restoreGuidelineSuccess = guideline => ({
  type: RESTORE_GUIDELINE_SUCCESS,
  guideline
});

export const restoreGuidelineFailure = error => ({
  type: RESTORE_GUIDELINE_FAILURE,
  error
});

export const restoreGuideline =
  ({ id }) =>
  (dispatch, getState) => {
    dispatch(restoreGuidelineAction());

    const requestOptions = {
      method: 'POST',
      headers: getState().login.authorizationHeader
    };

    return fetch(restoreGuidelineUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(restoreGuidelineSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          restoreGuidelineFailure(
            makeErrorMessage(error.message, `Restoring guideline`),
            error.message
          )
        );
      });
  };
