import { combineReducers } from 'redux';
import admin from './AdminReducer';
import advancedsearch from './AdvancedsearchReducer';
import associateDocumentToEntrance from './AssociateDocumentToEntrance';
import cave from './CaveReducer';
import changePassword from './ChangePassword';
import changeEmail from './ChangeEmail';
import createCave from './CreateCaveReducer';
import createDescription from './CreateDescription';
import createLocation from './CreateLocation';
import createMassif from './CreateMassifReducer';
import createOrganization from './CreateOrganization';
import createPerson from './CreatePerson';
import createHistory from './CreateHistory';
import document from './DocumentReducer';
import documentChildren from './DocumentChildrenReducer';
import documentDetails from './DetailsDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import entrancePost from './EntrancePostReducer';
import entrancePut from './EntrancePutReducer';
import entry from './EntryReducer';
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
import organizationPost from './OrganizationPostReducer';
import organizationPut from './OrganizationPutReducer';
import pageTitle from './PageTitleReducer';
import partnersCarousel from './PartnersCarouselReducer';
import person from './PersonReducer';
import updatePersonGroups from './UpdatePersonGroupesReducer';
import processDocuments from './ProcessDocumentsReducer';
import projections from './Projections';
import quicksearch from './QuicksearchReducer';
import randomEntry from './RandomEntryReducer';
import region from './RegionReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import subject from './SubjectReducer';
import updateCave from './UpdateCaveReducer';
import updateDescription from './UpdateDescription';
import updateHistory from './UpdateHistory';
import updateLocation from './UpdateLocation';
import updateMassif from './UpdateMassifReducer';
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
  entrancePost,
  entrancePut,
  entry,
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
  organizationPost,
  organizationPut,
  pageTitle,
  partnersCarousel,
  person,
  processDocuments,
  projections,
  quicksearch,
  randomEntry,
  region,
  sideMenu,
  signUp,
  subject,
  updateCave,
  updateDescription,
  updateHistory,
  updateLocation,
  updateMassif,
  updatePerson,
  updatePersonGroups
});

export default GCReducer;
