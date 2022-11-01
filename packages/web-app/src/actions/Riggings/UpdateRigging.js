import fetch from 'isomorphic-fetch';
import { putRiggingsUrl } from '../../conf/apiRoutes';

export const UPDATE_RIGGINGS = 'UPDATE_RIGGINGS';
export const UPDATE_RIGGINGS_SUCCESS = 'UPDATE_RIGGINGS_SUCCESS';
export const UPDATE_RIGGINGS_FAILURE = 'UPDATE_RIGGINGS_FAILURE';

export const updateRiggingsAction = () => ({
  type: UPDATE_RIGGINGS
});

export const updateRiggingsSuccess = riggings => ({
  type: UPDATE_RIGGINGS_SUCCESS,
  riggings
});

export const updateRiggingsFailure = error => ({
  type: UPDATE_RIGGINGS_FAILURE,
  error
});

function transformData(data) {
  return {
    id: data.id,
    language: data.language,
    title: data.title,
    obstacles: data.obstacles
  };
}

export const updateRiggings = data => (dispatch, getState) => {
  dispatch(updateRiggingsAction());
  const requestOptions = {
    method: 'PATCH',
    body: JSON.stringify(transformData(data)),
    headers: getState().login.authorizationHeader
  };

  return fetch(putRiggingsUrl(data.id), requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(updateRiggingsSuccess(JSON.parse(text))))
    .catch(errorMessage => {
      dispatch(updateRiggingsFailure(errorMessage));
    });
};
