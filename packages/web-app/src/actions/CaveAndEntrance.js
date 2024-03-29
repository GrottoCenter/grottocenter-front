import fetch from 'isomorphic-fetch';

import { postCreateCaveUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

import {
  postCaveAction,
  postCaveFailure,
  postCaveSuccess
} from './Cave/CreateCave';
import { updateCave } from './Cave/UpdateCave';
import { postEntrance } from './Entrance/CreateEntrance';
import { updateEntrance } from './Entrance/UpdateEntrance';

export const postCaveAndEntrance =
  (caveData, entranceData) => (dispatch, getState) => {
    dispatch(postCaveAction());

    const requestOptions = {
      method: 'POST',
      body: JSON.stringify(caveData),
      headers: getState().login.authorizationHeader
    };

    return fetch(postCreateCaveUrl, requestOptions)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.json();
      })
      .then(res => {
        dispatch(postCaveSuccess());
        dispatch(postEntrance({ ...entranceData, cave: res.id }));
      })
      .catch(error =>
        dispatch(
          postCaveFailure(
            makeErrorMessage(error.message, `Bad request`),
            error.message
          )
        )
      );
  };

export const updateCaveAndEntrance = (caveData, entranceData) => dispatch => {
  dispatch(updateCave(caveData));
  dispatch(updateEntrance(entranceData));
};
