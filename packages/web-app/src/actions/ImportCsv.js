import fetch from 'isomorphic-fetch';
import {
  checkRowsEntrancesUrl,
  checkRowsDocumentsUrl,
  importRowsEntrancesUrl,
  importRowsDocumentsUrl
} from '../conf/apiRoutes';
import { checkStatusAndGetText } from './utils';

export const CHECK_ROWS_START = 'CHECK_ROWS_START';
export const CHECK_ROWS_SUCCESS = 'CHECK_ROWS_SUCCESS';
export const CHECK_ROWS_FAILURE = 'CHECK_ROWS_FAILURE';

export const IMPORT_ROWS_START = 'IMPORT_ROWS_START';
export const IMPORT_ROWS_SUCCESS = 'IMPORT_ROWS_SUCCESS';
export const IMPORT_ROWS_FAILURE = 'IMPORT_ROWS_FAILURE';

export const RESET_IMPORT_STATE = 'RESET_IMPORT_STATE';

export const checkRowsStart = () => ({
  type: CHECK_ROWS_START
});

export const checkRowsSuccess = requestResult => ({
  type: CHECK_ROWS_SUCCESS,
  result: requestResult
});

export const checkRowsFailure = errorMessage => ({
  type: CHECK_ROWS_FAILURE,
  error: errorMessage
});

export const importRowsStart = () => ({
  type: IMPORT_ROWS_START
});

export const importRowsSuccess = requestResult => ({
  type: IMPORT_ROWS_SUCCESS,
  result: requestResult
});

export const importRowsFailure = errorMessage => ({
  type: IMPORT_ROWS_FAILURE,
  error: errorMessage
});

export const resetImportState = () => ({
  type: RESET_IMPORT_STATE
});

export const checkRowsInBdd = (typeRow, rowsData) => (dispatch, getState) => {
  dispatch(checkRowsStart());
  let url;
  switch (typeRow) {
    case 0:
      url = checkRowsEntrancesUrl;
      break;
    case 1:
      url = checkRowsDocumentsUrl;
      break;
    default:
      dispatch(checkRowsFailure('Invalid type of rows.'));
      return;
  }

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ data: rowsData }),
    headers: getState().login.authorizationHeader
  };

  // eslint-disable-next-line consistent-return
  return fetch(url, requestOptions)
    .then(checkStatusAndGetText)
    .then(response => response.json())
    .then(responseJson => {
      dispatch(checkRowsSuccess(responseJson));
    })
    .catch(error => {
      dispatch(checkRowsFailure(error.message));
    });
};

export const importRows = (data, typeRow) => (dispatch, getState) => {
  dispatch(importRowsStart());
  let url;
  switch (typeRow) {
    case 0:
      url = importRowsEntrancesUrl;
      break;
    case 1:
      url = importRowsDocumentsUrl;
      break;
    default:
      dispatch(importRowsFailure('Invalid type of rows.'));
      return;
  }

  const requestBody = JSON.stringify({
    data
  });

  const requestOptions = {
    method: 'POST',
    body: requestBody,
    headers: getState().login.authorizationHeader
  };

  // eslint-disable-next-line consistent-return
  return fetch(url, requestOptions)
    .then(checkStatusAndGetText)
    .then(response => response.json())
    .then(responseJson => {
      dispatch(importRowsSuccess(responseJson));
    })
    .catch(error => {
      dispatch(importRowsFailure(error.message));
    });
};
