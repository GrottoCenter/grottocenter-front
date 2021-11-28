import { combineReducers } from 'redux';
import advancedsearch from './AdvancedsearchReducer';
import cave from './CaveReducer';
import caver from './CaverReducer';
import caverGroups from './CaverGroupsReducer';
import changePassword from './ChangePassword';
import createCaver from './CreateCaver';
import createOrganization from './CreateOrganization';
import document from './DocumentReducer';
import documentChildren from './DocumentChildrenReducer';
import documentDetails from './DetailsDocumentReducer';
import documents from './DocumentsReducer';
import documentType from './DocumentTypeReducer';
import dynamicNumber from './DynamicNumberReducer';
import entry from './EntryReducer';
import error from './ErrorReducer';
import fileFormats from './FileFormatsReducer';
import identifierType from './IdentifierTypesReducer';
import importCsv from './ImportCsvReducer';
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
import intl from './IntlReducer';
import forgotPassword from './ForgotPasswordReducer';
import entrancePost from './EntrancePostReducer';
import cavePost from './CavePostReducer';

const GCReducer = combineReducers({
  advancedsearch,
  cave,
  caver,
  caverGroups,
  changePassword,
  createCaver,
  createOrganization,
  document,
  documentChildren,
  documentDetails,
  documents,
  documentType,
  dynamicNumber,
  entry,
  error,
  fileFormats,
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
  forgotPassword,
  subject,
  entrancePost,
  cavePost
});

export default GCReducer;
