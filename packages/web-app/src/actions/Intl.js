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

// A locale counts as loaded only if it actually carries messages. An empty
// object is what a failed fetch used to leave behind, and because the guard
// below is a plain `in` test, that empty entry made the locale permanently
// "loaded": every later attempt short-circuited and the UI stayed on raw
// message ids until a full reload — including after the connection came back.
export const hasLoadedMessages = (messages, locale) =>
  Object.keys(messages?.[locale] ?? {}).length > 0;

export const changeLocale = locale => (dispatch, getState) => {
  if (hasLoadedMessages(getState().intl.messages, locale)) {
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
  intlBootstrap.initialFetchP.then(data => {
    // index.html resolves to null when its head-start fetch failed (offline
    // first launch, or a launch before the service worker ever cached
    // /lang/*.json). Storing that as messages would poison the locale — see
    // hasLoadedMessages. Fail instead, so a retry stays possible.
    if (!data || Object.keys(data).length === 0) {
      dispatch(
        changeLocaleLoadFailure(
          new Error(`Could not load /lang/${intlBootstrap.initialLocale}.json`)
        )
      );
      return;
    }
    dispatch(changeLocaleLoadSuccess(intlBootstrap.initialLocale, data));
  });
};
