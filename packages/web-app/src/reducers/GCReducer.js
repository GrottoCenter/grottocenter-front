import { combineReducers } from 'redux';
import account from './AccountReducer';
import banCaver from './BanCaverReducer';
import changeEmail from './ChangeEmail';
import changePassword from './ChangePassword';
import detachEntrance from './DetachEntranceReducer';
import duplicatesImport from './DuplicatesImportReducer';
import error from './ErrorReducer';
import forgotPassword from './ForgotPasswordReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import login from './LoginReducer';
import map from './Map';
import mfa from './MfaReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import region from './RegionReducer';
import resendVerificationEmail from './ResendVerificationEmailReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import updateAccount from './UpdateAccountReducer';
import verifyEmail from './VerifyEmailReducer';

const GCReducer = combineReducers({
  account,
  banCaver,
  changeEmail,
  changePassword,
  detachEntrance,
  duplicatesImport,
  error,
  forgotPassword,
  importWizard,
  intl,
  login,
  map,
  mfa,
  moveEntranceToCave,
  region,
  resendVerificationEmail,
  sideMenu,
  signUp,
  updateAccount,
  verifyEmail
});

export default GCReducer;
