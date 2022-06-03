import { getFileFormatsUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

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

const checkStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response.json();
  }
  const errorCode = new Error(response.status);
  throw errorCode;
};

export const fetchFormats = () => dispatch => {
  dispatch(fetchFormatsLoad());

  return fetch(getFileFormatsUrl)
    .then(checkStatus)
    .then(response => {
      dispatch(fetchFormatsSuccess(response.fileFormats));
    })
    .catch(error => {
      dispatch(fetchFormatsError(error.message));
    });
};
