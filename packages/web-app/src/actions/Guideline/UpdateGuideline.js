import fetch from 'isomorphic-fetch';
import { patchGuidelineUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const PATCH_GUIDELINE = 'PATCH_GUIDELINE';
export const PATCH_GUIDELINE_SUCCESS = 'PATCH_GUIDELINE_SUCCESS';
export const PATCH_GUIDELINE_FAILURE = 'PATCH_GUIDELINE_FAILURE';

export const patchGuidelineAction = () => ({
  type: PATCH_GUIDELINE
});

export const patchGuidelineSuccess = guideline => ({
  type: PATCH_GUIDELINE_SUCCESS,
  guideline
});

export const patchGuidelineFailure = error => ({
  type: PATCH_GUIDELINE_FAILURE,
  error
});

export const patchGuideline =
  ({ id, title, description, language, countries, regions, massifs }) =>
  (dispatch, getState) => {
    dispatch(patchGuidelineAction());

    const requestOptions = {
      method: 'PATCH',
      body: JSON.stringify({ title, description, language, countries, regions, massifs }),
      headers: {
        ...getState().login.authorizationHeader,
        'Content-Type': 'application/json'
      }
    };

    return fetch(patchGuidelineUrl(id), requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(patchGuidelineSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          patchGuidelineFailure(
            makeErrorMessage(error.message, `Updating guideline`),
            error.message
          )
        );
      });
  };
