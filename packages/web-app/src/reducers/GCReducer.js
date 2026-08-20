import { combineReducers } from 'redux';
import account from './AccountReducer';
import changeEmail from './ChangeEmail';
import changePassword from './ChangePassword';
import duplicatesImport from './DuplicatesImportReducer';
import error from './ErrorReducer';
import forgotPassword from './ForgotPasswordReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import login from './LoginReducer';
import map from './Map';
import mfa from './MfaReducer';
import region from './RegionReducer';
import resendVerificationEmail from './ResendVerificationEmailReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import verifyEmail from './VerifyEmailReducer';

const GCReducer = combineReducers({
  account,
  changeEmail,
  changePassword,
  duplicatesImport,
  error,
  forgotPassword,
  importWizard,
  intl,
  login,
  map,
  mfa,
  region,
  resendVerificationEmail,
  sideMenu,
  signUp,
  verifyEmail
});

export default GCReducer;
