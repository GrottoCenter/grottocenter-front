import { combineReducers } from 'redux';
import account from './AccountReducer';
import advancedsearch from './AdvancedsearchReducer';
import banCaver from './BanCaverReducer';
import bannedCavers from './BannedCaversReducer';
import invalidEmailCavers from './InvalidEmailCaversReducer';
import linkDocumentToEntrance from './LinkDocumentToEntrance';
import unlinkDocumentToEntrance from './UnlinkDocumentToEntrance';
import cave from './CaveReducer';
import changePassword from './ChangePassword';
import changeEmail from './ChangeEmail';
import country from './CountryReducer';
import countUnreadNotifications from './CountUnreadNotificationsReducer';
import createCave from './CreateCaveReducer';
import createDescription from './CreateDescription';
import createDocument from './CreateDocumentReducer';
import createEntrance from './CreateEntranceReducer';
import createGuideline from './CreateGuidelineReducer';
import createHistory from './CreateHistory';
import createLocation from './CreateLocation';
import createMassif from './CreateMassifReducer';
import createOrganization from './CreateOrganization';
import createPerson from './CreatePerson';
import cumulatedLength from './CumulatedLengthReducer';
import dbExport from './DBExportReducer';
import deleteGuideline from './DeleteGuidelineReducer';
import detachEntrance from './DetachEntranceReducer';
import documentChildren from './DocumentChildrenReducer';
import documentDetails from './DetailsDocumentReducer';
import parentDocument from './ParentDocumentReducer';
import authorizationDocument from './AuthorizationDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import updateEntrance from './UpdateEntranceReducer';
import entrance from './EntranceReducer';
import error from './ErrorReducer';
import fileFormats from './FileFormatsReducer';
import forgotPassword from './ForgotPasswordReducer';
import groups from './GroupsReducer';
import identifierType from './IdentifierTypesReducer';
import importCsv from './ImportCsvReducer';
import intl from './IntlReducer';
import language from './LanguageReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import licenses from './LicensesReducer';
import login from './LoginReducer';
import map from './Map';
import massif from './MassifReducer';
import mfa from './MfaReducer';
import menuNotifications from './MenuNotificationsReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import notifications from './NotificationsReducer';
import organization from './OrganizationReducer';
import partnersCarousel from './PartnersCarouselReducer';
import person from './PersonReducer';
import updatePersonGroups from './UpdatePersonGroupesReducer';
import processDocuments from './ProcessDocumentsReducer';
import projections from './Projections';
import quicksearch from './QuicksearchReducer';
import randomEntrance from './RandomEntranceReducer';
import readNotification from './ReadNotificationReducer';
import recentChange from './RecentChangeReducer';
import region from './RegionReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import verifyEmail from './VerifyEmailReducer';
import resendVerificationEmail from './ResendVerificationEmailReducer';
import restoreGuideline from './RestoreGuidelineReducer';
import rollbackGuideline from './RollbackGuidelineReducer';
import snapshots from './SnapshotReducer';
import statisticsMassif from './StatisticsMassifReducer';
import statisticsCountry from './StatisticsCountryReducer';
import statisticsRegion from './StatisticsRegionReducer';
import regionDetails from './RegionDetailsReducer';
import subject from './SubjectReducer';
import subscribeToCountry from './SubscribeToCountryReducer';
import subscribeToMassif from './SubscribeToMassifReducer';
import subscribeToRegion from './SubscribeToRegionReducer';
import subscriptions from './SubscriptionsReducer';
import unsubscribeFromCountry from './UnsubscribeFromCountryReducer';
import unsubscribeFromMassif from './UnsubscribeFromMassifReducer';
import unsubscribeFromRegion from './UnsubscribeFromRegionReducer';
import updateCave from './UpdateCaveReducer';
import updateDescription from './UpdateDescription';
import updateDocument from './UpdateDocumentReducer';
import updateGuideline from './UpdateGuidelineReducer';
import updateHistory from './UpdateHistory';
import updateLocation from './UpdateLocation';
import updateMassif from './UpdateMassifReducer';
import updateName from './UpdateNameReducer';
import updateOrganization from './UpdateOrganization';
import updateAccount from './UpdateAccountReducer';
import updatePerson from './UpdatePerson';
import massifEntrances from './MassifEntrancesDataQualityReducer';
import countryEntrances from './CountryEntrancesDataQualityReducer';
import countryRegions from './CountryRegionsReducer';
import regionEntrances from './RegionEntrancesDataQualityReducer';

const GCReducer = combineReducers({
  account,
  advancedsearch,
  banCaver,
  bannedCavers,
  invalidEmailCavers,
  linkDocumentToEntrance,
  unlinkDocumentToEntrance,
  cave,
  changePassword,
  changeEmail,
  country,
  countUnreadNotifications,
  createCave,
  createDescription,
  createDocument,
  createEntrance,
  createGuideline,
  createHistory,
  createLocation,
  createMassif,
  createOrganization,
  createPerson,
  cumulatedLength,
  dbExport,
  deleteGuideline,
  detachEntrance,
  documentChildren,
  documentDetails,
  parentDocument,
  documents,
  documentType,
  duplicatesImport,
  dynamicNumber,
  updateEntrance,
  authorizationDocument,
  entrance,
  error,
  fileFormats,
  forgotPassword,
  groups,
  identifierType,
  importCsv,
  intl,
  language,
  latestBlogNews,
  licenses,
  login,
  map,
  massif,
  massifEntrances,
  mfa,
  menuNotifications,
  moveEntranceToCave,
  notifications,
  organization,
  partnersCarousel,
  person,
  processDocuments,
  projections,
  quicksearch,
  randomEntrance,
  readNotification,
  recentChange,
  region,
  sideMenu,
  signUp,
  verifyEmail,
  resendVerificationEmail,
  restoreGuideline,
  rollbackGuideline,
  snapshots,
  statisticsMassif,
  statisticsCountry,
  statisticsRegion,
  regionDetails,
  subject,
  subscribeToCountry,
  subscribeToMassif,
  subscribeToRegion,
  subscriptions,
  unsubscribeFromCountry,
  unsubscribeFromMassif,
  unsubscribeFromRegion,
  updateCave,
  updateDescription,
  updateDocument,
  updateGuideline,
  updateHistory,
  updateLocation,
  updateMassif,
  updateName,
  updateAccount,
  updateOrganization,
  updatePerson,
  updatePersonGroups,
  countryEntrances,
  countryRegions,
  regionEntrances
});

export default GCReducer;
