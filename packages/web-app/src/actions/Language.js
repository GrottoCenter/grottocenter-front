import fetch from 'isomorphic-fetch';
import { getLanguagesUrl } from '../conf/apiRoutes';
import makeErrorMessage from '../helpers/makeErrorMessage';
import { checkAndGetStatus } from './utils';

export const FETCH_LANGUAGES = 'FETCH_LANGUAGES';
export const FETCH_LANGUAGES_SUCCESS = 'FETCH_LANGUAGES_SUCCESS';
export const FETCH_LANGUAGES_FAILURE = 'FETCH_LANGUAGES_FAILURE';

export const CHANGE_LANGUAGE = 'CHANGE_LANGUAGE';

export const fetchLanguages = () => ({
  type: FETCH_LANGUAGES
});

export const fetchLanguagesSuccess = languages => ({
  type: FETCH_LANGUAGES_SUCCESS,
  languages
});

export const fetchLanguagesFailure = error => ({
  type: FETCH_LANGUAGES_FAILURE,
  error
});

export function loadLanguages(isPreferredLanguage) {
  return dispatch => {
    dispatch(fetchLanguages());

    return fetch(`${getLanguagesUrl}?isPreferedLanguage=${isPreferredLanguage}`)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => dispatch(fetchLanguagesSuccess(data.languages)))
      .catch(error =>
        dispatch(
          fetchLanguagesFailure(
            makeErrorMessage(error.message, `Fetching languages`)
          )
        )
      );
  };
}

export const changeLanguage = lang => ({
  type: CHANGE_LANGUAGE,
  lang
});
