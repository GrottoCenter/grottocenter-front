import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { changeLocale } from '../actions/Intl';
import { fetchAccount } from '../actions/Account/GetAccount';
import { loadLanguages } from '../actions/Language';
import { updateAccount } from '../actions/Account/UpdateAccount';
import { usePermissions } from '.';
import { languageIdToLocale, localeToLanguageId } from '../utils/languageMapping';

const useLanguageSync = () => {
  const dispatch = useDispatch();
  const { isAuth } = usePermissions();
  const { locale } = useSelector(state => state.intl);
  const { account } = useSelector(state => state.account);
  const { isLoaded: languagesLoaded } = useSelector(state => state.language);
  const mountedRef = useRef(false);

  // On login: load account data and API language list
  useEffect(() => {
    if (isAuth) {
      dispatch(fetchAccount());
      if (!languagesLoaded) dispatch(loadLanguages(true));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  // account.language → UI locale (after login or after a PATCH)
  useEffect(() => {
    if (!account?.language) return;
    const targetLocale = languageIdToLocale(account.language);
    if (targetLocale && targetLocale !== locale) {
      window.localStorage.setItem('selectedLanguage', targetLocale);
      dispatch(changeLocale(targetLocale));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.language]);

  // UI locale → account.language (user changed the AppBar selector after mount)
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (!isAuth) return;
    const languageId = localeToLanguageId(locale);
    if (languageId && languageId !== account?.language)
      dispatch(updateAccount({ language: languageId }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);
};

export default useLanguageSync;
