import fetch from 'isomorphic-fetch';
import {
  checkRowsEntrancesUrl,
  checkRowsDocumentsUrl,
  importRowsEntrancesUrl,
  importRowsDocumentsUrl,
  jobStatusUrl
} from '../conf/apiRoutes';
import { checkAuthStatus } from './utils';

export const CHECK_ROWS_START = 'CHECK_ROWS_START';
export const CHECK_ROWS_SUCCESS = 'CHECK_ROWS_SUCCESS';
export const CHECK_ROWS_FAILURE = 'CHECK_ROWS_FAILURE';

export const IMPORT_ROWS_START = 'IMPORT_ROWS_START';
export const IMPORT_ROWS_SUBMITTED = 'IMPORT_ROWS_SUBMITTED';
export const IMPORT_ROWS_PROGRESS = 'IMPORT_ROWS_PROGRESS';
export const IMPORT_ROWS_SUCCESS = 'IMPORT_ROWS_SUCCESS';
export const IMPORT_ROWS_FAILURE = 'IMPORT_ROWS_FAILURE';
export const IMPORT_ROWS_POLL_FAILURE = 'IMPORT_ROWS_POLL_FAILURE';

export const RESET_IMPORT_STATE = 'RESET_IMPORT_STATE';

// i18n keys used as the `error` payload of the async entrance flow so the
// message is localized in the component instead of hardcoded English here.
export const JOB_FAILED_ERROR = 'csvImport.jobFailedError';
export const POLL_FAILED_ERROR = 'csvImport.pollFailedError';

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

export const importRowsSubmitted = ({ batchId, totalRows, totalChunks }) => ({
  type: IMPORT_ROWS_SUBMITTED,
  payload: { batchId, totalRows, totalChunks }
});

export const importRowsProgress = ({ status, progress }) => ({
  type: IMPORT_ROWS_PROGRESS,
  payload: { status, progress }
});

// `result` always holds the resultImport payload; `status`/`progress` are only
// present for the async entrance flow (documents stay synchronous, no job to
// track) — this keeps the reducer's handling of both flows unambiguous.
export const importRowsSuccess = ({
  status = null,
  progress = null,
  result
}) => ({
  type: IMPORT_ROWS_SUCCESS,
  status,
  progress,
  result
});

// `progress` is only set when the failure comes from a completed job batch
// with status "failed" (result stays null on that path — see the API contract
// notes in the plan) so the UI can still show progress.failures.
export const importRowsFailure = (errorMessage, progress = null) => ({
  type: IMPORT_ROWS_FAILURE,
  error: errorMessage,
  progress
});

export const importRowsPollFailure = errorMessage => ({
  type: IMPORT_ROWS_POLL_FAILURE,
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
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(responseJson => {
      dispatch(checkRowsSuccess(responseJson));
    })
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(checkRowsFailure(error.message));
    });
};

// Documents import stayed synchronous on the API side (only entrances import
// was moved to the async queue), so this keeps the previous request/response
// handling untouched.
export const importDocumentRows = data => (dispatch, getState) => {
  dispatch(importRowsStart());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ data }),
    headers: getState().login.authorizationHeader
  };

  // eslint-disable-next-line consistent-return
  return fetch(importRowsDocumentsUrl, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(responseJson => {
      dispatch(importRowsSuccess({ result: responseJson }));
    })
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(importRowsFailure(error.message));
    });
};

// Single poll tick. Resolves (never rejects) with an outcome the polling hook
// uses to decide whether to keep going:
//   'terminal' — the job reached a final state (or auth failed): stop polling.
//   'pending'  — the job is still running: schedule another tick.
//   'error'    — this single tick failed (network blip, malformed body): the
//                hook retries a few times before giving up, so one bad tick
//                does not kill the whole polling loop.
export const pollJobStatus = batchId => (dispatch, getState) => {
  const requestOptions = {
    method: 'GET',
    headers: getState().login.authorizationHeader
  };

  return fetch(jobStatusUrl(batchId), requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(({ status, progress, result }) => {
      if (status === 'completed') {
        dispatch(importRowsSuccess({ status, progress, result }));
        return 'terminal';
      }
      if (status === 'failed') {
        dispatch(importRowsFailure(JOB_FAILED_ERROR, progress));
        return 'terminal';
      }
      dispatch(importRowsProgress({ status, progress }));
      return 'pending';
    })
    .catch(error => {
      // Auth failures are already handled by checkAuthStatus (redirect): stop
      // quietly. Any other error is transient from this tick's point of view —
      // let the hook decide whether repeated failures warrant giving up.
      if (error.isAuthError) return 'terminal';
      return 'error';
    });
};

export const importEntranceRows = data => (dispatch, getState) => {
  dispatch(importRowsStart());

  const requestOptions = {
    method: 'POST',
    body: JSON.stringify({ data }),
    headers: getState().login.authorizationHeader
  };

  // eslint-disable-next-line consistent-return
  return fetch(importRowsEntrancesUrl, requestOptions)
    .then(checkAuthStatus(dispatch))
    .then(response => response.json())
    .then(result => {
      // The entrance import is being migrated to an async job queue. Until that
      // API is deployed it still answers synchronously (the documents shape:
      // `total`, `successfulImport`, ...) with no `batchId`. Detect that and
      // treat it as an immediate result — otherwise we'd enter a phantom
      // polling state that never resolves, since useJobPolling bails without a
      // batchId and isPolling would stay true forever.
      if (result.batchId) {
        dispatch(importRowsSubmitted(result));
      } else {
        dispatch(importRowsSuccess({ result }));
      }
    })
    .catch(error => {
      if (error.isAuthError) return;
      dispatch(importRowsFailure(error.message));
    });
};
