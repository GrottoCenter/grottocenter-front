import fetch from 'isomorphic-fetch';
import { postGuidelineUrl } from '../../conf/apiRoutes';
import makeErrorMessage from '../../helpers/makeErrorMessage';
import { checkAuthStatus } from '../utils';

export const POST_GUIDELINE = 'POST_GUIDELINE';
export const POST_GUIDELINE_SUCCESS = 'POST_GUIDELINE_SUCCESS';
export const POST_GUIDELINE_FAILURE = 'POST_GUIDELINE_FAILURE';

export const postGuidelineAction = () => ({
  type: POST_GUIDELINE
});

export const postGuidelineSuccess = guideline => ({
  type: POST_GUIDELINE_SUCCESS,
  guideline
});

export const postGuidelineFailure = error => ({
  type: POST_GUIDELINE_FAILURE,
  error
});

export const postGuideline =
  ({ entityType, entityId, title, description, language }) =>
  (dispatch, getState) => {
    dispatch(postGuidelineAction());

    const mappedEntityType =
      {
        countries: 'country',
        regions: 'region',
        massifs: 'massif'
      }[entityType] || entityType;

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify({
        entityType: mappedEntityType,
        entityId,
        title,
        description,
        language
      }),
      headers: {
        ...getState().login.authorizationHeader,
        'Content-Type': 'application/json'
      }
    };

    return fetch(postGuidelineUrl, requestOptions)
      .then(checkAuthStatus(dispatch))
      .then(response => response.json())
      .then(data => dispatch(postGuidelineSuccess(data)))
      .catch(error => {
        if (error.isAuthError) return;
        dispatch(
          postGuidelineFailure(
            makeErrorMessage(error.message, `Creating a new guideline`),
            error.message
          )
        );
      });
  };
