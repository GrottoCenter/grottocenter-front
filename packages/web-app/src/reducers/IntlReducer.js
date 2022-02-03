import { keys, includes } from 'ramda';
import { DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES } from '../conf/Config';
import { CHANGE_LOCALE } from '../actions/Intl';
import translations from '../lang';

const initialLocale = navigator.language.split(/[-_]/)[0];

const initialState = {
  locale: includes(initialLocale, keys(AVAILABLE_LANGUAGES))
    ? initialLocale
    : DEFAULT_LANGUAGE,
  messages: translations,
  AVAILABLE_LANGUAGES
};

const intl = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_LOCALE:
      return { ...state, locale: action.locale };
    default:
      return state;
  }
};

export default intl;
