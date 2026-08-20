import { combineReducers } from 'redux';
import account from './AccountReducer';
import advancedsearch from './AdvancedsearchReducer';
import banCaver from './BanCaverReducer';
import changeEmail from './ChangeEmail';
import changePassword from './ChangePassword';
import countryRegions from './CountryRegionsReducer';
import createDocument from './CreateDocumentReducer';
import detachEntrance from './DetachEntranceReducer';
import documents from './DocumentsReducer';
import duplicatesImport from './DuplicatesImportReducer';
import error from './ErrorReducer';
import forgotPassword from './ForgotPasswordReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import login from './LoginReducer';
import map from './Map';
import mfa from './MfaReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import quicksearch from './QuicksearchReducer';
import region from './RegionReducer';
import resendVerificationEmail from './ResendVerificationEmailReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import updateAccount from './UpdateAccountReducer';
import updateDocument from './UpdateDocumentReducer';
import verifyEmail from './VerifyEmailReducer';

const GCReducer = combineReducers({
  account,
  advancedsearch,
  banCaver,
  changeEmail,
  changePassword,
  countryRegions,
  createDocument,
  detachEntrance,
  documents,
  duplicatesImport,
  error,
  forgotPassword,
  importWizard,
  intl,
  login,
  map,
  mfa,
  moveEntranceToCave,
  quicksearch,
  region,
  resendVerificationEmail,
  sideMenu,
  signUp,
  updateAccount,
  updateDocument,
  verifyEmail
});

export default GCReducer;
