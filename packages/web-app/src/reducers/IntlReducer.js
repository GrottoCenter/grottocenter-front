import { keys, includes } from 'ramda';
import { DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES } from '../conf/Config';
import { CHANGE_LOCALE } from '../actions/Intl';
import translations from '../lang';

const navigatorLocale = navigator.language.split(/[-_]/)[0];
const initialLocale = includes(navigatorLocale, keys(AVAILABLE_LANGUAGES))
  ? navigatorLocale
  : DEFAULT_LANGUAGE;

const initialState = {
  locale: initialLocale,
  languageObject: AVAILABLE_LANGUAGES[initialLocale],
  messages: translations,
  AVAILABLE_LANGUAGES
};

const intl = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_LOCALE:
      return {
        ...state,
        locale: action.locale,
        languageObject: AVAILABLE_LANGUAGES[action.locale]
      };
    default:
      return state;
  }
};

export default intl;
