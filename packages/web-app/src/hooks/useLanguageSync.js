import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changeLocale } from '../actions/Intl';
import { useAccount, useUpdateAccount, usePermissions } from '.';
import {
  languageIdToLocale,
  localeToLanguageId
} from '../utils/languageMapping';

const useLanguageSync = () => {
  const dispatch = useDispatch();
  const { isAuth } = usePermissions();
  const { locale } = useSelector(state => state.intl);
  // useAccount is only enabled while isAuth is true — no explicit fetch trigger
  // is needed here.
  const { data: account } = useAccount();
  const updateAccountMutation = useUpdateAccount();
  const mountedRef = useRef(false);
  // Set to true while effect 1 is programmatically changing locale to prevent
  // effect 2 from dispatching a redundant PATCH before the invalidated
  // account query resolves.
  const syncingFromAccountRef = useRef(false);

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
      updateAccountMutation.mutate({ language: languageId });
    // Mirror of the effect above: only a locale change may trigger the PATCH.
    // `account?.language` is read as a guard, but listing it would re-run this
    // when the PATCH response lands and loop the two effects against each other.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);
};

export default useLanguageSync;
