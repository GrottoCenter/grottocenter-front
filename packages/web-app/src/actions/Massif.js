import fetch from 'isomorphic-fetch';
import {
  findMassifUrl,
  putMassifUrl,
  postCreateMassifUrl
} from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_MASSIF = 'FETCH_MASSIF';
export const FETCH_MASSIF_SUCCESS = 'FETCH_MASSIF_SUCCESS';
export const FETCH_MASSIF_FAILURE = 'FETCH_MASSIF_FAILURE';

export const POST_MASSIF = 'POST_MASSIF';
export const POST_MASSIF_SUCCESS = 'POST_MASSIF_SUCCESS';
export const POST_MASSIF_FAILURE = 'POST_MASSIF_FAILURE';

export const UPDATE_MASSIF = 'UPDATE_MASSIF';
export const UPDATE_MASSIF_SUCCESS = 'UPDATE_MASSIF_SUCCESS';
export const UPDATE_MASSIF_FAILURE = 'UPDATE_MASSIF_FAILURE';

export const fetchMassif = () => ({
  type: FETCH_MASSIF
});

export const fetchMassifSuccess = massif => ({
  type: FETCH_MASSIF_SUCCESS,
  massif
});

export const fetchMassifFailure = error => ({
  type: FETCH_MASSIF_FAILURE,
  error
});
export const postMassifAction = () => ({
  type: POST_MASSIF
});
export const postMassifSuccess = massif => ({
  massif,
  type: POST_MASSIF_SUCCESS
});
export const postMassifFailure = (error, httpCode) => ({
  type: POST_MASSIF_FAILURE,
  error,
  httpCode
});

export const updateMassifAction = () => ({
  type: UPDATE_MASSIF
});
export const updateMassifSuccess = massif => ({
  massif,
  type: UPDATE_MASSIF_SUCCESS
});
export const updateMassifFailure = (error, httpCode) => ({
  type: UPDATE_MASSIF_FAILURE,
  error,
  httpCode
});

export function loadMassif(massifId) {
  return dispatch => {
    dispatch(fetchMassif());

    return fetch(findMassifUrl + massifId)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => dispatch(fetchMassifSuccess(JSON.parse(text))))
      .catch(error =>
        dispatch(
          fetchMassifFailure(
            makeErrorMessage(error.message, `Fetching massif id ${massifId}`)
          )
        )
      );
  };
}
export const postMassif = data => {
  return (dispatch, getState) => {
    dispatch(postMassifAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(data),
      headers: getState().login.authorizationHeader
    };

    return fetch(postCreateMassifUrl, requestOptions)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(res => {
        dispatch(postMassifSuccess(res));
      })
      .catch(error =>
        dispatch(
          postMassifFailure(
            makeErrorMessage(error.message, `Bad request`),
            error.message
          )
        )
      );
  };
};

export const updateMassif = data => {
  return (dispatch, getState) => {
    dispatch(updateMassifAction());

    const requestOptions = {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: getState().login.authorizationHeader
    };

    return fetch(putMassifUrl(data.id), requestOptions)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(res => {
        dispatch(updateMassifSuccess(res));
      })
      .catch(error =>
        dispatch(
          updateMassifFailure(
            makeErrorMessage(error.message, `Bad request`),
            error.message
          )
        )
      );
  };
};
