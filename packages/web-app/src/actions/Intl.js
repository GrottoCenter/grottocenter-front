import fetch from 'isomorphic-fetch';
import { checkAndGetStatus } from './utils';

export const CHANGE_LOCALE = 'CHANGE_LOCALE';
export const CHANGE_LOCALE_SUCCESS = 'CHANGE_LOCALE_SUCCESS';
export const CHANGE_LOCALE_LOAD_SUCCESS = 'CHANGE_LOCALE_LOAD_SUCCESS';
export const CHANGE_LOCALE_LOAD_FAILURE = 'CHANGE_LOCALE_LOAD_FAILURE';

export const changeLocaleAction = () => ({
  type: CHANGE_LOCALE
});

export const changeLocaleSuccess = locale => ({
  type: CHANGE_LOCALE_SUCCESS,
  locale
});

export const changeLocaleLoadSuccess = (locale, messages) => ({
  type: CHANGE_LOCALE_LOAD_SUCCESS,
  locale,
  messages
});

export const changeLocaleLoadFailure = error => ({
  type: CHANGE_LOCALE_LOAD_FAILURE,
  error
});

export const changeLocale = locale => (dispatch, getState) => {
  if (locale in getState().intl.messages) {
    // The locale is already loaded
    return dispatch(changeLocaleSuccess(locale));
  }

  dispatch(changeLocaleAction());
  return fetch(`/lang/${locale}.json`)
    .then(checkAndGetStatus)
    .then(response => response.json())
    .then(data => dispatch(changeLocaleLoadSuccess(locale, data)))
    .catch(errorMessage => {
      dispatch(changeLocaleLoadFailure(errorMessage));
    });
};

export const bootstrapIntl = () => dispatch => {
  intlBootstrap.initialFetchP.then(data =>
    dispatch(changeLocaleLoadSuccess(intlBootstrap.initialLocale, data))
  );
};
