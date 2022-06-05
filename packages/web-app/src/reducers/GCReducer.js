import { combineReducers } from 'redux';
import advancedsearch from './AdvancedsearchReducer';
import associateDocumentToEntrance from './AssociateDocumentToEntrance';
import cave from './CaveReducer';
import cavePost from './CavePostReducer';
import cavePut from './CavePutReducer';
import caver from './CaverReducer';
import caverGroups from './CaverGroupsReducer';
import changePassword from './ChangePassword';
import createCaver from './CreateCaver';
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
import massifPost from './MassifPostReducer';
import massifPut from './MassifPutReducer';
import moveEntranceToCave from './MoveEntranceToCaveReducer';
import namePut from './NamePutReducer';
import organization from './OrganizationReducer';
import organizationPost from './OrganizationPostReducer';
import organizationPut from './OrganizationPutReducer';
import pageTitle from './PageTitleReducer';
import partnersCarousel from './PartnersCarouselReducer';
import person from './PersonReducer';
import processDocuments from './ProcessDocumentsReducer';
import projections from './Projections';
import quicksearch from './QuicksearchReducer';
import randomEntry from './RandomEntryReducer';
import region from './RegionReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import subject from './SubjectReducer';
import updateLocation from './UpdateLocation';
import updateHistory from './UpdateHistory';
import updateDescription from './UpdateDescription';

const GCReducer = combineReducers({
  advancedsearch,
  associateDocumentToEntrance,
  cave,
  cavePost,
  cavePut,
  caver,
  caverGroups,
  changePassword,
  createCaver,
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
  massifPost,
  massifPut,
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
  updateLocation,
  updateHistory,
  updateDescription
});

export default GCReducer;
