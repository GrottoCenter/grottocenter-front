import fetch from 'isomorphic-fetch';

import { postCreateCaveUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

import { postCaveAction, postCaveFailure } from './Cave';
import { postEntrance } from './Entry';

// eslint-disable-next-line import/prefer-default-export
export const postCaveAndEntrance = (caveData, entranceData) => {
  return (dispatch, getState) => {
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
        return res;
      })
      .then(res => {
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
};
