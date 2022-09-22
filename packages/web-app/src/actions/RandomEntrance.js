import fetch from 'isomorphic-fetch';
import { getRandomEntranceUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const FETCH_RANDOM_ENTRANCE = 'FETCH_RANDOM_ENTRANCE';
export const FETCH_RANDOM_ENTRANCE_SUCCESS = 'FETCH_RANDOM_ENTRANCE_SUCCESS';
export const FETCH_RANDOM_ENTRANCE_FAILURE = 'FETCH_RANDOM_ENTRANCE_FAILURE';

export const fetchRandomEntranceNumber = () => ({
  type: FETCH_RANDOM_ENTRANCE,
  entry: undefined
});

export const fetchRandomEntranceSuccess = entrance => ({
  type: FETCH_RANDOM_ENTRANCE_SUCCESS,
  entrance
});

export const fetchRandomEntranceFailure = error => ({
  type: FETCH_RANDOM_ENTRANCE_FAILURE,
  error
});

export const loadRandomEntrance = () => dispatch => {
  dispatch(fetchRandomEntranceNumber());

  return fetch(getRandomEntranceUrl)
    .then(response => {
      if (response.status >= 400) {
        throw new Error(response.status);
      }
      return response.text();
    })
    .then(text => dispatch(fetchRandomEntranceSuccess(JSON.parse(text))))
    .catch(error =>
      dispatch(
        fetchRandomEntranceFailure(
          makeErrorMessage(error.message, `Fetching random entrance`)
        )
      )
    );
};
