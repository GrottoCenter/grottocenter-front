import { combineReducers } from 'redux';
import account from './AccountReducer';
import duplicatesImport from './DuplicatesImportReducer';
import error from './ErrorReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import login from './LoginReducer';
import map from './Map';
import mfa from './MfaReducer';
import sideMenu from './SideMenuReducer';

const GCReducer = combineReducers({
  account,
  duplicatesImport,
  error,
  importWizard,
  intl,
  login,
  map,
  mfa,
  sideMenu
});

export default GCReducer;
