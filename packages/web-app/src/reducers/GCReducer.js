import { combineReducers } from 'redux';
import admin from './AdminReducer';
import advancedsearch from './AdvancedsearchReducer';
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
import createHistory from './CreateHistory';
import createLocation from './CreateLocation';
import createMassif from './CreateMassifReducer';
import createOrganization from './CreateOrganization';
import createPerson from './CreatePerson';
import cumulatedLength from './CumulatedLengthReducer';
import dbExport from './DBExportReducer';
import documentChildren from './DocumentChildrenReducer';
import documentDetails from './DetailsDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import updateEntrance from './UpdateEntranceReducer';
import entrance from './EntranceReducer';
import error from './ErrorReducer';
import fileFormats from './FileFormatsReducer';
import forgotPassword from './ForgotPasswordReducer';
import identifierType from './IdentifierTypesReducer';
import importCsv from './ImportCsvReducer';
import intl from './IntlReducer';
import language from './LanguageReducer';
import latestBlogNews from './LatestBlogNewsReducer';
import licenses from './LicensesReducer';
import login from './LoginReducer';
import map from './Map';
import massif from './MassifReducer';
import menuNotifications from './MenuNotificationsReducer';
import moderator from './ModeratorReducer';
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
import snapshots from './SnapshotReducer';
import statisticsMassif from './StatisticsMassifReducer';
import statisticsCountry from './StatisticsCountryReducer';
import subject from './SubjectReducer';
import subscribeToCountry from './SubscribeToCountryReducer';
import subscribeToMassif from './SubscribeToMassifReducer';
import subscriptions from './SubscriptionsReducer';
import unsubscribeFromCountry from './UnsubscribeFromCountryReducer';
import unsubscribeFromMassif from './UnsubscribeFromMassifReducer';
import updateCave from './UpdateCaveReducer';
import updateDescription from './UpdateDescription';
import updateDocument from './UpdateDocumentReducer';
import updateHistory from './UpdateHistory';
import updateLocation from './UpdateLocation';
import updateMassif from './UpdateMassifReducer';
import updateName from './UpdateNameReducer';
import updateOrganization from './UpdateOrganization';
import updatePerson from './UpdatePerson';
import massifEntrances from './MassifEntrancesDataQualityReducer';
import countryEntrances from './CountryEntrancesDataQualityReducer';

const GCReducer = combineReducers({
  admin,
  advancedsearch,
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
  createHistory,
  createLocation,
  createMassif,
  createOrganization,
  createPerson,
  cumulatedLength,
  dbExport,
  document,
  documentChildren,
  documentDetails,
  documents,
  documentType,
  duplicatesImport,
  dynamicNumber,
  updateEntrance,
  entrance,
  error,
  fileFormats,
  forgotPassword,
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
  menuNotifications,
  moderator,
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
  snapshots,
  statisticsMassif,
  statisticsCountry,
  subject,
  subscribeToCountry,
  subscribeToMassif,
  subscriptions,
  unsubscribeFromCountry,
  unsubscribeFromMassif,
  updateCave,
  updateDescription,
  updateDocument,
  updateHistory,
  updateLocation,
  updateMassif,
  updateName,
  updateOrganization,
  updatePerson,
  updatePersonGroups,
  countryEntrances
});

export default GCReducer;
