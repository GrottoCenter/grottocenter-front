import { AVAILABLE_LANGUAGES } from '../conf/config';
import {
  CHANGE_LOCALE,
  CHANGE_LOCALE_SUCCESS,
  CHANGE_LOCALE_LOAD_SUCCESS,
  CHANGE_LOCALE_LOAD_FAILURE
} from '../actions/Intl';

const reactSupportedLanguages = Object.keys(AVAILABLE_LANGUAGES);
if (intlBootstrap.allLanguages.length !== reactSupportedLanguages.length)
  console.error(
    'Warning: intlBootstrap languages does not match react supported langages'
  );

const initialState = {
  locale: intlBootstrap.initialLocale,
  languageObject: AVAILABLE_LANGUAGES[intlBootstrap.initialLocale],
  messages: {},
  AVAILABLE_LANGUAGES,
  error: null,
  isLoading: false
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case CHANGE_LOCALE:
      return {
        ...state,
        isLoading: true
      };
    case CHANGE_LOCALE_SUCCESS:
      return {
        ...state,
        isLoading: false,
        locale: action.locale
      };
    case CHANGE_LOCALE_LOAD_SUCCESS:
      return {
        ...state,
        isLoading: false,
        locale: action.locale,
        messages: {
          ...state.messages,
          [action.locale]: action.messages
        }
      };
    case CHANGE_LOCALE_LOAD_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.error
      };
    default:
      return state;
  }
};

export default reducer;
