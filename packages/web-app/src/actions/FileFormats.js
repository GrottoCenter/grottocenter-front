import { getFileFormatsUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { checkAndGetStatus } from './utils';

export const FETCH_FORMATS_LOAD = 'FETCH_FORMATS_LOAD';
export const FETCH_FORMATS_SUCCESS = 'FETCH_FORMATS_SUCCESS';
export const FETCH_FORMATS_ERROR = 'FETCH_FORMATS_ERROR';

export const fetchFormatsLoad = () => ({
  type: FETCH_FORMATS_LOAD
});

export const fetchFormatsSuccess = licenses => ({
  type: FETCH_FORMATS_SUCCESS,
  payload: licenses
});

export const fetchFormatsError = error => ({
  type: FETCH_FORMATS_ERROR,
  error: makeErrorMessage(error, 'Error while fetching formats')
});

export const fetchFormats = () => dispatch => {
  dispatch(fetchFormatsLoad());

  return fetch(getFileFormatsUrl)
    .then(checkAndGetStatus)
    .then(response => {
      dispatch(fetchFormatsSuccess(response.fileFormats));
    })
    .catch(error => {
      dispatch(fetchFormatsError(error.message));
    });
};
