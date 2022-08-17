import { combineReducers } from 'redux';
import admin from './AdminReducer';
import advancedsearch from './AdvancedsearchReducer';
import associateDocumentToEntrance from './AssociateDocumentToEntrance';
import cave from './CaveReducer';
import cavePost from './CavePostReducer';
import cavePut from './CavePutReducer';
import changePassword from './ChangePassword';
import changeEmail from './ChangeEmail';
import createPerson from './CreatePerson';
import createLocation from './CreateLocation';
import createHistory from './CreateHistory';
import createOrganization from './CreateOrganization';
import createDescription from './CreateDescription';
import document from './DocumentReducer';
import documentChildren from './DocumentChildrenReducer';
import documentDetails from './DetailsDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import entrancePost from './EntrancePostReducer';
import entrancePut from './EntrancePutReducer';
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
import massifPost from './MassifPostReducer';
import massifPut from './MassifPutReducer';
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
import updateDescription from './UpdateDescription';
import updateHistory from './UpdateHistory';
import updateLocation from './UpdateLocation';
import updateOrganization from './UpdateOrganization';
import updatePerson from './UpdatePerson';

const GCReducer = combineReducers({
  admin,
  advancedsearch,
  associateDocumentToEntrance,
  cave,
  cavePost,
  cavePut,
  changePassword,
  changeEmail,
  createPerson,
  createLocation,
  createOrganization,
  createHistory,
  createDescription,
  document,
  documentChildren,
  documentDetails,
  documents,
  documentType,
  duplicatesImport,
  dynamicNumber,
  entrancePost,
  entrancePut,
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
  massifPost,
  massifPut,
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
  updateDescription,
  updateHistory,
  updateLocation,
  updateOrganization,
  updatePerson,
  updatePersonGroups
});

export default GCReducer;
