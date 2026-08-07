import { combineReducers } from 'redux';
import account from './AccountReducer';
import advancedsearch from './AdvancedsearchReducer';
import authorizationDocument from './AuthorizationDocumentReducer';
import banCaver from './BanCaverReducer';
import bannedCavers from './BannedCaversReducer';
import cave from './CaveReducer';
import changeEmail from './ChangeEmail';
import changePassword from './ChangePassword';
import countUnreadNotifications from './CountUnreadNotificationsReducer';
import country from './CountryReducer';
import countryEntrances from './CountryEntrancesDataQualityReducer';
import countryRegions from './CountryRegionsReducer';
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
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import duplicatesCount from './DuplicatesCountReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import entrance from './EntranceReducer';
import error from './ErrorReducer';
import fileFormats from './FileFormatsReducer';
import forgotPassword from './ForgotPasswordReducer';
import groups from './GroupsReducer';
import identifierType from './IdentifierTypesReducer';
import importCsv from './ImportCsvReducer';
import importWizard from './ImportWizardReducer';
import intl from './IntlReducer';
import invalidEmailCavers from './InvalidEmailCaversReducer';
import language from './LanguageReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import licenses from './LicensesReducer';
import linkDocumentToEntrance from './LinkDocumentToEntrance';
import login from './LoginReducer';
import map from './Map';
import massif from './MassifReducer';
import massifEntrances from './MassifEntrancesDataQualityReducer';
import mfa from './MfaReducer';
import menuNotifications from './MenuNotificationsReducer';
import messaging from './MessagingReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import notifications from './NotificationsReducer';
import organization from './OrganizationReducer';
import parentDocument from './ParentDocumentReducer';
import partnersCarousel from './PartnersCarouselReducer';
import pendingDocumentsCount from './PendingDocumentsCountReducer';
import person from './PersonReducer';
import processDocuments from './ProcessDocumentsReducer';
import projections from './Projections';
import quicksearch from './QuicksearchReducer';
import randomEntrance from './RandomEntranceReducer';
import readAllNotifications from './ReadAllNotificationsReducer';
import readNotification from './ReadNotificationReducer';
import recentChange from './RecentChangeReducer';
import region from './RegionReducer';
import regionDetails from './RegionDetailsReducer';
import regionEntrances from './RegionEntrancesDataQualityReducer';
import resendVerificationEmail from './ResendVerificationEmailReducer';
import restoreGuideline from './RestoreGuidelineReducer';
import rollbackGuideline from './RollbackGuidelineReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import snapshots from './SnapshotReducer';
import statisticsCountry from './StatisticsCountryReducer';
import statisticsMassif from './StatisticsMassifReducer';
import statisticsRegion from './StatisticsRegionReducer';
import subject from './SubjectReducer';
import subscribeToCountry from './SubscribeToCountryReducer';
import subscribeToMassif from './SubscribeToMassifReducer';
import subscribeToRegion from './SubscribeToRegionReducer';
import subscriptions from './SubscriptionsReducer';
import unlinkDocumentToEntrance from './UnlinkDocumentToEntrance';
import unsubscribeFromCountry from './UnsubscribeFromCountryReducer';
import unsubscribeFromMassif from './UnsubscribeFromMassifReducer';
import unsubscribeFromRegion from './UnsubscribeFromRegionReducer';
import updateAccount from './UpdateAccountReducer';
import updateCave from './UpdateCaveReducer';
import updateDescription from './UpdateDescription';
import updateDocument from './UpdateDocumentReducer';
import updateEntrance from './UpdateEntranceReducer';
import updateGuideline from './UpdateGuidelineReducer';
import updateHistory from './UpdateHistory';
import updateLocation from './UpdateLocation';
import updateMassif from './UpdateMassifReducer';
import updateName from './UpdateNameReducer';
import updateOrganization from './UpdateOrganization';
import updatePerson from './UpdatePerson';
import countryOrganization from './CountryOrganizationReducer';
import massifOrganization from './MassifOrganizationReducer';
import regionOrganization from './RegionOrganizationReducer';
import updatePersonGroups from './UpdatePersonGroupesReducer';
import verifyEmail from './VerifyEmailReducer';

const GCReducer = combineReducers({
  account,
  advancedsearch,
  authorizationDocument,
  banCaver,
  bannedCavers,
  cave,
  changeEmail,
  changePassword,
  countUnreadNotifications,
  country,
  countryEntrances,
  countryOrganization,
  countryRegions,
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
  documents,
  documentType,
  duplicatesCount,
  duplicatesImport,
  dynamicNumber,
  entrance,
  error,
  fileFormats,
  forgotPassword,
  groups,
  identifierType,
  importCsv,
  importWizard,
  intl,
  invalidEmailCavers,
  language,
  latestBlogNews,
  licenses,
  linkDocumentToEntrance,
  login,
  map,
  massif,
  massifEntrances,
  massifOrganization,
  mfa,
  menuNotifications,
  messaging,
  moveEntranceToCave,
  notifications,
  organization,
  parentDocument,
  partnersCarousel,
  pendingDocumentsCount,
  person,
  processDocuments,
  projections,
  quicksearch,
  randomEntrance,
  readAllNotifications,
  readNotification,
  recentChange,
  region,
  regionDetails,
  regionEntrances,
  regionOrganization,
  resendVerificationEmail,
  restoreGuideline,
  rollbackGuideline,
  sideMenu,
  signUp,
  snapshots,
  statisticsCountry,
  statisticsMassif,
  statisticsRegion,
  subject,
  subscribeToCountry,
  subscribeToMassif,
  subscribeToRegion,
  subscriptions,
  unlinkDocumentToEntrance,
  unsubscribeFromCountry,
  unsubscribeFromMassif,
  unsubscribeFromRegion,
  updateAccount,
  updateCave,
  updateDescription,
  updateDocument,
  updateEntrance,
  updateGuideline,
  updateHistory,
  updateLocation,
  updateMassif,
  updateName,
  updateOrganization,
  updatePerson,
  updatePersonGroups,
  verifyEmail
});

export default GCReducer;
