import { getLicensesUrl } from '../conf/Config';
import makeErrorMessage from '../helpers/makeErrorMessage';

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

const checkStatus = response => {
  if (response.status >= 200 && response.status <= 300) {
    return response.json();
  }
  const errorCode = new Error(response.status);
  throw errorCode;
};

export const fetchLicense = () => dispatch => {
  dispatch(fetchLicenseLoad());

  return fetch(getLicensesUrl)
    .then(checkStatus)
    .then(response => {
      dispatch(fetchLicenseSuccess(response.licenses));
    })
    .catch(error => {
      dispatch(fetchLicenseError(error.message));
    });
};
