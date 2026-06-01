import fetch from 'isomorphic-fetch';
import { putGuidelineUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const PUT_GUIDELINE = 'PUT_GUIDELINE';
export const PUT_GUIDELINE_SUCCESS = 'PUT_GUIDELINE_SUCCESS';
export const PUT_GUIDELINE_FAILURE = 'PUT_GUIDELINE_FAILURE';

export const putGuidelineAction = () => ({
  type: PUT_GUIDELINE
});

export const putGuidelineSuccess = guideline => ({
  type: PUT_GUIDELINE_SUCCESS,
  guideline
});

export const putGuidelineFailure = error => ({
  type: PUT_GUIDELINE_FAILURE,
  error
});

export const putGuideline =
  ({ id, title, description, language }) =>
  (dispatch, getState) => {
    dispatch(putGuidelineAction());

    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify({ title, description, language }),
      headers: getState().login.authorizationHeader
    };

    return fetch(putGuidelineUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(putGuidelineSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          putGuidelineFailure(
            makeErrorMessage(error.message, `Updating guideline`),
            error.message
          )
        );
      });
  };
