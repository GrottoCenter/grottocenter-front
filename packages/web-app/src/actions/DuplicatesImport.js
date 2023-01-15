import fetch from 'isomorphic-fetch';
import { isNil, pipe, map, join } from 'ramda';
import {
  getDuplicateDocumentUrl,
  getDuplicateEntranceUrl,
  getDuplicatesDocumentUrl,
  getDuplicatesEntranceUrl,
  deleteDuplicatesDocumentUrl,
  deleteDuplicatesEntranceUrl,
  createNewEntranceFromDuplicateUrl,
  createNewDocumentFromDuplicateUrl,
  deleteDuplicateEntranceUrl,
  deleteDuplicateDocumentUrl
} from '../conf/apiRoutes';
import { checkAndGetStatus, makeUrl } from './utils';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const LOAD_DUPLICATES_LIST = 'LOAD_DUPLICATES_LIST';
export const LOAD_DUPLICATES_LIST_SUCCESS = 'LOAD_DUPLICATES_LIST_SUCCESS';
export const LOAD_DUPLICATES_LIST_FAILURE = 'LOAD_DUPLICATES_LIST_FAILURE';

export const LOAD_DUPLICATE = 'LOAD_DUPLICATE';
export const LOAD_DUPLICATE_SUCCESS = 'LOAD_DUPLICATE_SUCCESS';
export const LOAD_DUPLICATE_FAILURE = 'LOAD_DUPLICATE_FAILURE';

export const DELETE_DUPLICATE = 'DELETE_DUPLICATE';
export const DELETE_DUPLICATE_SUCCESS = 'DELETE_DUPLICATE_SUCCESS';
export const DELETE_DUPLICATE_ERROR = 'DELETE_DUPLICATE_ERROR';

export const CREATE_NEW_ENTITY_FROM_DUPLICATE =
  'CREATE_NEW_ENTITY_FROM_DUPLICATE';
export const CREATE_NEW_ENTITY_FROM_DUPLICATE_SUCCESS =
  'CREATE_NEW_ENTITY_FROM_DUPLICATE_SUCCESS';
export const CREATE_NEW_ENTITY_FROM_DUPLICATE_FAILURE =
  'CREATE_NEW_ENTITY_FROM_DUPLICATE_FAILURE';

export const RESET_STATE = 'RESET_STATE';

export const loadDuplicatesList = () => ({
  type: LOAD_DUPLICATES_LIST
});

export const loadDuplicatesListSuccess = (duplicates, statusCode) => ({
  type: LOAD_DUPLICATES_LIST_SUCCESS,
  duplicates,
  httpCode: statusCode
});

export const loadDuplicatesListFailure = error => ({
  type: LOAD_DUPLICATES_LIST_FAILURE,
  error
});

export const loadDuplicate = () => ({
  type: LOAD_DUPLICATE
});

export const loadDuplicateSuccess = (duplicate, statusCode) => ({
  type: LOAD_DUPLICATE_SUCCESS,
  duplicate,
  httpCode: statusCode
});

export const loadDuplicateFailure = error => ({
  type: LOAD_DUPLICATE_FAILURE,
  error
});

export const deleteDuplicatesAction = () => ({
  type: DELETE_DUPLICATE
});

export const deleteDuplicatesSuccess = code => ({
  type: DELETE_DUPLICATE_SUCCESS,
  httpCode: code
});

export const deleteDuplicatesError = error => ({
  type: DELETE_DUPLICATE_ERROR,
  error,
  httpCode: parseInt(error.type, 10)
});

export const deleteDuplicateAction = () => ({
  type: DELETE_DUPLICATE
});

export const deleteDuplicateSuccess = code => ({
  type: DELETE_DUPLICATE_SUCCESS,
  httpCode: code
});

export const deleteDuplicateError = error => ({
  type: DELETE_DUPLICATE_ERROR,
  error,
  httpCode: parseInt(error.type, 10)
});

export const createNewEntityFromDuplicateAction = () => ({
  type: CREATE_NEW_ENTITY_FROM_DUPLICATE
});

export const createNewEntityDuplicateSuccess = code => ({
  type: CREATE_NEW_ENTITY_FROM_DUPLICATE_SUCCESS,
  httpCode: code
});

export const createNewEntityDuplicateError = error => ({
  type: CREATE_NEW_ENTITY_FROM_DUPLICATE_FAILURE,
  error,
  httpCode: parseInt(error.type, 10)
});

const getBody = async response => ({
  content: await response.json(),
  statusCode: response.status
});

export const fetchDuplicatesList =
  (duplicateType, criteria) => (dispatch, getState) => {
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
        return dispatch(loadDuplicateFailure('Incorrect type of duplicates.'));
    }

    const requestOptions = {
      headers: getState().login.authorizationHeader
    };

    return fetch(isNil(criteria) ? url : makeUrl(url, criteria), requestOptions)
      .then(checkAndGetStatus)
      .then(getBody)
      .then(contentAndStatus => {
        dispatch(
          loadDuplicatesListSuccess(
            contentAndStatus.content.duplicates,
            contentAndStatus.statusCode
          )
        );
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
      return dispatch(loadDuplicateFailure('Incorrect type of duplicates.'));
  }

  const requestOptions = {
    headers: getState().login.authorizationHeader
  };

  return fetch(url(id), requestOptions)
    .then(checkAndGetStatus)
    .then(getBody)
    .then(contentAndStatus => {
      dispatch(
        loadDuplicateSuccess(
          contentAndStatus.content,
          contentAndStatus.statusCode
        )
      );
    })
    .catch(error => {
      dispatch(loadDuplicateFailure(error.message));
    });
};

export const deleteDuplicates =
  (ids, duplicateType) => (dispatch, getState) => {
    dispatch(deleteDuplicatesAction());

    let url = '';
    switch (duplicateType) {
      case 'entrance':
        url = deleteDuplicatesEntranceUrl;
        break;
      case 'document':
        url = deleteDuplicatesDocumentUrl;
        break;
      default:
        return dispatch(deleteDuplicatesError('Incorrect type of duplicates.'));
    }

    url = pipe(
      map(id => `id=${encodeURIComponent(id)}`),
      join('&'),
      urlCriteria => `${url}?${urlCriteria}`
    )(ids);

    const requestOptions = {
      headers: getState().login.authorizationHeader,
      method: 'DELETE'
    };

    return fetch(url, requestOptions)
      .then(checkAndGetStatus)
      .then(response => {
        dispatch(deleteDuplicatesSuccess(response.status));
      })
      .catch(error => {
        dispatch(
          deleteDuplicatesError(
            makeErrorMessage(error.message, `Deleting duplicates`)
          )
        );
      });
  };

export const deleteDuplicate = (id, duplicateType) => (dispatch, getState) => {
  dispatch(deleteDuplicatesAction());

  let url = '';
  switch (duplicateType) {
    case 'entrance':
      url = deleteDuplicateEntranceUrl;
      break;
    case 'document':
      url = deleteDuplicateDocumentUrl;
      break;
    default:
      return dispatch(deleteDuplicateError('Incorrect type of duplicates.'));
  }

  const requestOptions = {
    headers: getState().login.authorizationHeader,
    method: 'DELETE'
  };

  return fetch(url(id), requestOptions)
    .then(checkAndGetStatus)
    .then(response => {
      dispatch(deleteDuplicatesSuccess(response.status));
    })
    .catch(error => {
      dispatch(
        deleteDuplicatesError(
          makeErrorMessage(error.message, `Deleting duplicate`)
        )
      );
    });
};

export const createNewEntityFromDuplicate =
  (id, duplicateType) => (dispatch, getState) => {
    dispatch(deleteDuplicatesAction());

    let url = '';
    switch (duplicateType) {
      case 'entrance':
        url = createNewEntranceFromDuplicateUrl;
        break;
      case 'document':
        url = createNewDocumentFromDuplicateUrl;
        break;
      default:
        return dispatch(loadDuplicateFailure('Incorrect type of duplicates.'));
    }

    const requestOptions = {
      headers: getState().login.authorizationHeader,
      method: 'POST'
    };

    return fetch(url(id), requestOptions)
      .then(checkAndGetStatus)
      .then(response => {
        dispatch(createNewEntityDuplicateSuccess(response.status));
      })
      .catch(error => {
        dispatch(
          createNewEntityDuplicateError(
            makeErrorMessage(
              error.message,
              `Creating new entity from duplicate`
            )
          )
        );
      });
  };

export const resetState = () => ({
  type: RESET_STATE
});
