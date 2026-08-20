import { combineReducers } from 'redux';
import account from './AccountReducer';
import advancedsearch from './AdvancedsearchReducer';
import banCaver from './BanCaverReducer';
import bannedCavers from './BannedCaversReducer';
import changeEmail from './ChangeEmail';
import changePassword from './ChangePassword';
import countryEntrances from './CountryEntrancesDataQualityReducer';
import countryRegions from './CountryRegionsReducer';
import createDocument from './CreateDocumentReducer';
import cumulatedLength from './CumulatedLengthReducer';
import dbExport from './DBExportReducer';
import detachEntrance from './DetachEntranceReducer';
import documents from './DocumentsReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import error from './ErrorReducer';
import forgotPassword from './ForgotPasswordReducer';
import groups from './GroupsReducer';
import importCsv from './ImportCsvReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import invalidEmailCavers from './InvalidEmailCaversReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import login from './LoginReducer';
import map from './Map';
import massifEntrances from './MassifEntrancesDataQualityReducer';
import mfa from './MfaReducer';
import messaging from './MessagingReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import partnersCarousel from './PartnersCarouselReducer';
import processDocuments from './ProcessDocumentsReducer';
import quicksearch from './QuicksearchReducer';
import randomEntrance from './RandomEntranceReducer';
import recentChange from './RecentChangeReducer';
import region from './RegionReducer';
import regionEntrances from './RegionEntrancesDataQualityReducer';
import resendVerificationEmail from './ResendVerificationEmailReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import statisticsCountry from './StatisticsCountryReducer';
import statisticsMassif from './StatisticsMassifReducer';
import statisticsRegion from './StatisticsRegionReducer';
import subscribeToCountry from './SubscribeToCountryReducer';
import subscribeToMassif from './SubscribeToMassifReducer';
import subscribeToRegion from './SubscribeToRegionReducer';
import subscriptions from './SubscriptionsReducer';
import unsubscribeFromCountry from './UnsubscribeFromCountryReducer';
import unsubscribeFromMassif from './UnsubscribeFromMassifReducer';
import unsubscribeFromRegion from './UnsubscribeFromRegionReducer';
import updateAccount from './UpdateAccountReducer';
import updateDocument from './UpdateDocumentReducer';
import verifyEmail from './VerifyEmailReducer';

const GCReducer = combineReducers({
  account,
  advancedsearch,
  banCaver,
  bannedCavers,
  changeEmail,
  changePassword,
  countryEntrances,
  countryRegions,
  createDocument,
  cumulatedLength,
  dbExport,
  detachEntrance,
  documents,
  duplicatesImport,
  dynamicNumber,
  error,
  forgotPassword,
  groups,
  importCsv,
  importWizard,
  intl,
  invalidEmailCavers,
  latestBlogNews,
  login,
  map,
  massifEntrances,
  mfa,
  messaging,
  moveEntranceToCave,
  partnersCarousel,
  processDocuments,
  quicksearch,
  randomEntrance,
  recentChange,
  region,
  regionEntrances,
  resendVerificationEmail,
  sideMenu,
  signUp,
  statisticsCountry,
  statisticsMassif,
  statisticsRegion,
  subscribeToCountry,
  subscribeToMassif,
  subscribeToRegion,
  subscriptions,
  unsubscribeFromCountry,
  unsubscribeFromMassif,
  unsubscribeFromRegion,
  updateAccount,
  updateDocument,
  verifyEmail
});

export default GCReducer;
