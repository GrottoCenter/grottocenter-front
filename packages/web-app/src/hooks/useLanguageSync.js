import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changeLocale } from '../actions/Intl';
import { fetchAccount } from '../actions/Account/GetAccount';
import { loadLanguages } from '../actions/Language';
import { updateAccount } from '../actions/Account/UpdateAccount';
import { usePermissions } from '.';
import {
  languageIdToLocale,
  localeToLanguageId
} from '../utils/languageMapping';

const useLanguageSync = () => {
  const dispatch = useDispatch();
  const { isAuth } = usePermissions();
  const { locale } = useSelector(state => state.intl);
  const { account } = useSelector(state => state.account);
  const { isLoaded: languagesLoaded } = useSelector(state => state.language);
  const mountedRef = useRef(false);
  // Set to true while effect 2 is programmatically changing locale to prevent
  // effect 3 from dispatching a redundant PATCH before fetchAccount resolves.
  const syncingFromAccountRef = useRef(false);

  // On login: load account data and API language list
  useEffect(() => {
    if (isAuth) {
      dispatch(fetchAccount());
      if (!languagesLoaded) dispatch(loadLanguages(true));
    }
    // Deliberately keyed on the auth transition alone. Adding `languagesLoaded`
    // would re-run this as soon as `loadLanguages` resolves and refetch the
    // account for nothing; `dispatch` is a stable reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  // account.language → UI locale (after login or after a PATCH)
  useEffect(() => {
    if (!account?.language) return;
    const targetLocale = languageIdToLocale(account.language);
    if (targetLocale && targetLocale !== locale) {
      syncingFromAccountRef.current = true;
      window.localStorage.setItem('selectedLanguage', targetLocale);
      dispatch(changeLocale(targetLocale));
    }
    // `locale` is read but must not be a dependency: this effect only reacts to
    // the account being the source of truth. Listing `locale` would re-run it on
    // a user-initiated language change and immediately revert that choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.language]);

  // UI locale → account.language (user changed the AppBar selector after mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (syncingFromAccountRef.current) {
      syncingFromAccountRef.current = false;
      return;
    }
    if (!isAuth) return;
    const languageId = localeToLanguageId(locale);
    if (languageId && languageId !== account?.language)
      dispatch(updateAccount({ language: languageId }));
    // Mirror of the effect above: only a locale change may trigger the PATCH.
    // `account?.language` is read as a guard, but listing it would re-run this
    // when the PATCH response lands and loop the two effects against each other.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);
};

export default useLanguageSync;
