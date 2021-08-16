import fetch from 'isomorphic-fetch';
import { isNil } from 'ramda';
import {
  getDuplicateDocumentUrl,
  getDuplicateEntranceUrl,
  getDuplicatesDocumentUrl,
  getDuplicatesEntranceUrl
} from '../conf/Config';

export const LOAD_DUPLICATES_LIST = 'LOAD_DUPLICATES_LIST';
export const LOAD_DUPLICATES_LIST_SUCCESS = 'LOAD_DUPLICATES_LIST_SUCCESS';
export const LOAD_DUPLICATES_LIST_FAILURE = 'LOAD_DUPLICATES_LIST_FAILURE';

export const LOAD_DUPLICATE = 'LOAD_DUPLICATE';
export const LOAD_DUPLICATE_SUCCESS = 'LOAD_DUPLICATE_SUCCESS';
export const LOAD_DUPLICATE_FAILURE = 'LOAD_DUPLICATE_FAILURE';

export const UPDATE_DATABASE = 'UPDATE_DATABASE';
export const UPDATE_DATABASE_SUCCESS = 'UPDATE_DATABASE_SUCCESS';
export const UPDATE_DATABASE_FAILURE = 'UPDATE_DATABASE_FAILURE';

export const CREATE_NEW_RECORD = 'CREATE_NEW_RECORD';
export const CREATE_NEW_RECORD_SUCCESS = 'CREATE_NEW_RECORD_SUCCESS';
export const CREATE_NEW_RECORD_FAILURE = 'CREATE_NEW_RECORD_FAILURE';

export const loadDuplicatesList = () => ({
  type: LOAD_DUPLICATES_LIST
});

export const loadDuplicatesListSuccess = duplicatesList => ({
  type: LOAD_DUPLICATES_LIST_SUCCESS,
  payload: duplicatesList
});

export const loadDuplicatesListFailure = error => ({
  type: LOAD_DUPLICATES_LIST_FAILURE,
  error
});

export const loadDuplicate = () => ({
  type: LOAD_DUPLICATE
});

export const loadDuplicateSuccess = files => ({
  type: LOAD_DUPLICATE_SUCCESS,
  payload: files
});

export const loadDuplicateFailure = error => ({
  type: LOAD_DUPLICATE_FAILURE,
  error
});

export const updateDuplicatesAction = () => ({
  type: UPDATE_DATABASE
});

export const updateDuplicatesSuccess = files => ({
  type: UPDATE_DATABASE_SUCCESS,
  payload: files
});

export const updateDuplicatesFailure = error => ({
  type: UPDATE_DATABASE_FAILURE,
  error
});

export const createNewRecordAction = () => ({
  type: CREATE_NEW_RECORD
});

export const createNewRecordSuccess = () => ({
  type: CREATE_NEW_RECORD_SUCCESS
});

export const createNewRecordFailure = () => ({
  type: CREATE_NEW_RECORD_FAILURE
});

const checkStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response.json();
  }
  const errorMessage = new Error(response.statusText);
  throw errorMessage;
};

const makeUrl = (url, criteria) => {
  if (criteria) {
    return `${url}?${Object.keys(criteria)
      .map(k => `${k}=${encodeURIComponent(criteria[k])}`)
      .join('&')}`;
  }
  return url;
};

export const fetchDuplicatesList = (duplicateType, criteria) => (
  dispatch,
  getState
) => {
  dispatch(loadDuplicatesList());
  let url = '';
  switch (duplicateType) {
    case 'entrance':
      url = getDuplicatesEntranceUrl;
      break;
    case 'document':
      url = getDuplicatesDocumentUrl;
      break;
    default:
      dispatch(loadDuplicateFailure('Incorrect type of duplicates.'));
  }

  const requestOptions = {
    headers: getState().login.authorizationHeader
  };

  return fetch(isNil(criteria) ? url : makeUrl(url, criteria), requestOptions)
    .then(checkStatus)
    .then(result => {
      dispatch(loadDuplicatesListSuccess(result));
    })
    .catch(error => {
      dispatch(loadDuplicatesListFailure(error.message));
    });
};

export const fetchDuplicate = (id, duplicateType) => (dispatch, getState) => {
  dispatch(loadDuplicate());
  let url = '';
  switch (duplicateType) {
    case 'entrance':
      url = getDuplicateEntranceUrl;
      break;
    case 'document':
      url = getDuplicateDocumentUrl;
      break;
    default:
      dispatch(loadDuplicateFailure('Incorrect type of duplicates.'));
  }

  const requestOptions = {
    headers: getState().login.authorizationHeader
  };

  return fetch(url(id), requestOptions)
    .then(checkStatus)
    .then(result => {
      dispatch(loadDuplicateSuccess(result));
    })
    .catch(error => {
      dispatch(loadDuplicateFailure(error.message));
    });
};
