import { getLicensesUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { checkAndGetStatus } from './utils';

export const FETCH_LICENSES_LOAD = 'FETCH_LICENSES_LOAD';
export const FETCH_LICENSES_SUCCESS = 'FETCH_LICENSES_SUCCESS';
export const FETCH_LICENSES_ERROR = 'FETCH_LICENSES_ERROR';

export const fetchLicenseLoad = () => ({
  type: FETCH_LICENSES_LOAD
});

export const fetchLicenseSuccess = licenses => ({
  type: FETCH_LICENSES_SUCCESS,
  payload: licenses
});

export const fetchLicenseError = error => ({
  type: FETCH_LICENSES_ERROR,
  error: makeErrorMessage(error, 'Error while fetching licenses')
});

export const fetchLicense = () => dispatch => {
  dispatch(fetchLicenseLoad());

  return fetch(getLicensesUrl)
    .then(checkAndGetStatus)
    .then(response => {
      dispatch(fetchLicenseSuccess(response.licenses));
    })
    .catch(error => {
      dispatch(fetchLicenseError(error.message));
    });
};
