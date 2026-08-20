import { combineReducers } from 'redux';
import account from './AccountReducer';
import advancedsearch from './AdvancedsearchReducer';
import banCaver from './BanCaverReducer';
import changeEmail from './ChangeEmail';
import changePassword from './ChangePassword';
import countryEntrances from './CountryEntrancesDataQualityReducer';
import countryRegions from './CountryRegionsReducer';
import createDocument from './CreateDocumentReducer';
import cumulatedLength from './CumulatedLengthReducer';
import detachEntrance from './DetachEntranceReducer';
import documents from './DocumentsReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import error from './ErrorReducer';
import forgotPassword from './ForgotPasswordReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import login from './LoginReducer';
import map from './Map';
import massifEntrances from './MassifEntrancesDataQualityReducer';
import mfa from './MfaReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import quicksearch from './QuicksearchReducer';
import region from './RegionReducer';
import regionEntrances from './RegionEntrancesDataQualityReducer';
import resendVerificationEmail from './ResendVerificationEmailReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import statisticsCountry from './StatisticsCountryReducer';
import statisticsMassif from './StatisticsMassifReducer';
import statisticsRegion from './StatisticsRegionReducer';
import updateAccount from './UpdateAccountReducer';
import updateDocument from './UpdateDocumentReducer';
import verifyEmail from './VerifyEmailReducer';

const GCReducer = combineReducers({
  account,
  advancedsearch,
  banCaver,
  changeEmail,
  changePassword,
  countryEntrances,
  countryRegions,
  createDocument,
  cumulatedLength,
  detachEntrance,
  documents,
  duplicatesImport,
  dynamicNumber,
  error,
  forgotPassword,
  importWizard,
  intl,
  login,
  map,
  massifEntrances,
  mfa,
  moveEntranceToCave,
  quicksearch,
  region,
  regionEntrances,
  resendVerificationEmail,
  sideMenu,
  signUp,
  statisticsCountry,
  statisticsMassif,
  statisticsRegion,
  updateAccount,
  updateDocument,
  verifyEmail
});

export default GCReducer;
