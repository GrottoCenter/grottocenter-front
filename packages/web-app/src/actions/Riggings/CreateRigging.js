import fetch from 'isomorphic-fetch';
import { postRiggingsUrl } from '../../conf/apiRoutes';

export const POST_RIGGINGS = 'POST_RIGGINGS';
export const POST_RIGGINGS_SUCCESS = 'POST_RIGGINGS_SUCCESS';
export const POST_RIGGINGS_FAILURE = 'POST_RIGGINGS_FAILURE';

export const postRiggingsAction = () => ({
  type: POST_RIGGINGS
});

export const postRiggingsSuccess = riggings => ({
  type: POST_RIGGINGS_SUCCESS,
  riggings
});

export const postRiggingsFailure = error => ({
  type: POST_RIGGINGS_FAILURE,
  error
});

function transformData(data, entranceId) {
  return {
    id: data.id,
    language: data.language.id,
    title: data.title,
    obstacles: data.obstacles
      ? data.obstacles.map(x => x.obstacle).join('|;|')
      : [],
    observations: data.obstacles
      ? data.obstacles.map(x => x.observation).join('|;|')
      : [],
    ropes: data.obstacles ? data.obstacles.map(x => x.rope).join('|;|') : [],
    anchors: data.obstacles
      ? data.obstacles.map(x => x.anchor).join('|;|')
      : [],
    entrance: entranceId
  };
}

export const postRiggings = (data, entranceId) => (dispatch, getState) => {
  dispatch(postRiggingsAction());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify(transformData(data, entranceId)),
    headers: getState().login.authorizationHeader
  };

  return fetch(postRiggingsUrl, requestOptions)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.json();
    })
    .then(json => dispatch(postRiggingsSuccess(json)))
    .catch(errorMessage => {
      dispatch(postRiggingsFailure(errorMessage));
    });
};
