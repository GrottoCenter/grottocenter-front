import { combineReducers } from 'redux';
import advancedsearch from './AdvancedsearchReducer';
import cave from './CaveReducer';
import cavePost from './CavePostReducer';
import caver from './CaverReducer';
import caverGroups from './CaverGroupsReducer';
import changePassword from './ChangePassword';
import createCaver from './CreateCaver';
import createLocation from './CreateLocation';
import createOrganization from './CreateOrganization';
import document from './DocumentReducer';
import documentChildren from './DocumentChildrenReducer';
import documentDetails from './DetailsDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import duplicatesImport from './DuplicatesImportReducer';
import dynamicNumber from './DynamicNumberReducer';
import entrancePost from './EntrancePostReducer';
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
import organization from './OrganizationReducer';
import pageTitle from './PageTitleReducer';
import partnersCarousel from './PartnersCarouselReducer';
import processDocuments from './ProcessDocumentsReducer';
import projections from './Projections';
import quicksearch from './QuicksearchReducer';
import randomEntry from './RandomEntryReducer';
import region from './RegionReducer';
import sideMenu from './SideMenuReducer';
import signUp from './SignUpReducer';
import subject from './SubjectReducer';
import updateLocation from './UpdateLocation';

const GCReducer = combineReducers({
  advancedsearch,
  cave,
  cavePost,
  caver,
  caverGroups,
  changePassword,
  createCaver,
  createLocation,
  createOrganization,
  document,
  documentChildren,
  documentDetails,
  documents,
  documentType,
  duplicatesImport,
  dynamicNumber,
  entrancePost,
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
  organization,
  pageTitle,
  partnersCarousel,
  processDocuments,
  projections,
  quicksearch,
  randomEntry,
  region,
  sideMenu,
  signUp,
  subject,
  updateLocation
});

export default GCReducer;
