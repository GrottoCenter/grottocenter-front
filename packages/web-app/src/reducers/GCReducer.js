import { combineReducers } from 'redux';
import account from './AccountReducer';
import error from './ErrorReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import login from './LoginReducer';
import map from './Map';
import sideMenu from './SideMenuReducer';

const GCReducer = combineReducers({
  account,
  error,
  importWizard,
  intl,
  login,
  map,
  sideMenu
});

export default GCReducer;
