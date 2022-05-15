import fetch from 'isomorphic-fetch';
import { patchDescriptionUrl, postCreateDescriptionUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const POST_DESCRIPTION = 'POST_DESCRIPTION';
export const POST_DESCRIPTION_SUCCESS = 'POST_DESCRIPTION_SUCCESS';
export const POST_DESCRIPTION_FAILURE = 'POST_DESCRIPTION_FAILURE';

export const UPDATE_DESCRIPTION = 'UPDATE_DESCRIPTION';
export const UPDATE_DESCRIPTION_SUCCESS = 'UPDATE_DESCRIPTION_SUCCESS';
export const UPDATE_DESCRIPTION_FAILURE = 'UPDATE_DESCRIPTION_FAILURE';

export const postDescriptionAction = () => ({
  type: POST_DESCRIPTION
});
export const postDescriptionSuccess = description => ({
  description,
  type: POST_DESCRIPTION_FAILURE
});
export const postDescriptionFailure = (error, httpCode) => ({
  type: POST_DESCRIPTION_FAILURE,
  error,
  httpCode
});

export const updateDescriptionAction = () => ({
  type: UPDATE_DESCRIPTION
});
export const updateDescriptionSuccess = description => ({
  description,
  type: UPDATE_DESCRIPTION_SUCCESS
});
export const updateDescriptionFailure = (error, httpCode) => ({
  type: UPDATE_DESCRIPTION_FAILURE,
  error,
  httpCode
});

export const postDescription = data => {
  return (dispatch, getState) => {
    dispatch(postDescriptionAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: getState().login.authorizationHeader
    };

    return fetch(postCreateDescriptionUrl, requestOptions)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(res => {
        dispatch(postDescriptionSuccess(res));
      })
      .catch(error =>
        dispatch(
          postDescriptionFailure(
            makeErrorMessage(error.message, `Bad request`),
            error.message
          )
        )
      );
  };
};

export const updateDescription = data => {
  return (dispatch, getState) => {
    dispatch(updateDescriptionAction());

    const requestOptions = {
      method: 'PATCH',
      body: JSON.stringify(data),
      headers: getState().login.authorizationHeader
    };

    return fetch(patchDescriptionUrl(data.id), requestOptions)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(res => {
        dispatch(updateDescriptionSuccess(res));
      })
      .catch(error =>
        dispatch(
          updateDescriptionFailure(
            makeErrorMessage(error.message, `Bad request`),
            error.message
          )
        )
      );
  };
};
