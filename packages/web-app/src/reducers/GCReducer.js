import { combineReducers } from 'redux';
import admin from './AdminReducer';
import advancedsearch from './AdvancedsearchReducer';
import associateDocumentToEntrance from './AssociateDocumentToEntrance';
import cave from './CaveReducer';
import changePassword from './ChangePassword';
import changeEmail from './ChangeEmail';
import createCave from './CreateCaveReducer';
import createDescription from './CreateDescription';
import createDocument from './CreateDocumentReducer';
import createEntrance from './CreateEntranceReducer';
import createHistory from './CreateHistory';
import createLocation from './CreateLocation';
import createMassif from './CreateMassifReducer';
import createOrganization from './CreateOrganization';
import createPerson from './CreatePerson';
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
import moderator from './ModeratorReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import namePut from './NamePutReducer';
import organization from './OrganizationReducer';
import pageTitle from './PageTitleReducer';
import partnersCarousel from './PartnersCarouselReducer';
import person from './PersonReducer';
import updatePersonGroups from './UpdatePersonGroupesReducer';
import processDocuments from './ProcessDocumentsReducer';
import projections from './Projections';
import quicksearch from './QuicksearchReducer';
import randomEntrance from './RandomEntranceReducer';
import region from './RegionReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import subject from './SubjectReducer';
import subscribeToMassif from './SubscribeToMassifReducer';
import subscriptions from './SubscriptionsReducer';
import unsubscribeFromMassif from './UnsubscribeFromMassifReducer';
import updateCave from './UpdateCaveReducer';
import updateDescription from './UpdateDescription';
import updateDocument from './UpdateDocumentReducer';
import updateHistory from './UpdateHistory';
import updateLocation from './UpdateLocation';
import updateMassif from './UpdateMassifReducer';
import updateOrganization from './UpdateOrganization';
import updatePerson from './UpdatePerson';

const GCReducer = combineReducers({
  admin,
  advancedsearch,
  associateDocumentToEntrance,
  cave,
  changePassword,
  changeEmail,
  createCave,
  createDescription,
  createDocument,
  createEntrance,
  createHistory,
  createLocation,
  createMassif,
  createOrganization,
  createPerson,
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
  moderator,
  moveEntranceToCave,
  namePut,
  organization,
  pageTitle,
  partnersCarousel,
  person,
  processDocuments,
  projections,
  quicksearch,
  randomEntrance,
  region,
  sideMenu,
  signUp,
  subject,
  subscribeToMassif,
  subscriptions,
  unsubscribeFromMassif,
  updateCave,
  updateDescription,
  updateDocument,
  updateHistory,
  updateLocation,
  updateMassif,
  updateOrganization,
  updatePerson,
  updatePersonGroups
});

export default GCReducer;
