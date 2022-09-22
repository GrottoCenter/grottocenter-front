import fetch from 'isomorphic-fetch';
import { dynamicNumbersUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';

export const INIT_DYNNB_FETCHER = 'INIT_DYNNB_FETCHER';
export const FETCH_DYNNB = 'FETCH_DYNNB';
export const FETCH_DYNNB_SUCCESS = 'FETCH_DYNNB_SUCCESS';
export const FETCH_DYNNB_FAILURE = 'FETCH_DYNNB_FAILURE';
export const LOAD_DYNNB = 'LOAD_DYNNB';

export const initDynamicNumberFetcher = numberType => ({
  type: INIT_DYNNB_FETCHER,
  numberType
});

export const fetchDynamicNumber = numberType => ({
  type: FETCH_DYNNB,
  numberType
});

export const fetchDynamicNumberSuccess = (numberType, number) => ({
  type: FETCH_DYNNB_SUCCESS,
  numberType,
  number
});

export const fetchDynamicNumberFailure = (numberType, error) => ({
  type: FETCH_DYNNB_FAILURE,
  numberType,
  error
});

export function loadDynamicNumber(numberType) {
  return dispatch => {
    dispatch(initDynamicNumberFetcher(numberType));
    dispatch(fetchDynamicNumber(numberType));

    const url = dynamicNumbersUrl[numberType];
    return fetch(url)
      .then(response => {
        if (response.status >= 400) {
          throw new Error(response.status);
        }
        return response.text();
      })
      .then(text => dispatch(fetchDynamicNumberSuccess(numberType, text)))
      .catch(error => {
        dispatch(
          fetchDynamicNumberFailure(
            numberType,
            makeErrorMessage(
              error.message,
              `Fetching number type ${numberType}`
            )
          )
        );
      });
  };
}
