import { lazy } from 'react';
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider
} from 'react-router-dom';

import grottoTheme from './conf/grottoTheme';

// Eagerly loaded: root layout, the landing page (first paint) and the auth
// guard. Everything else is route-split via React.lazy and rendered inside the
// <Suspense> boundary declared in ApplicationShell.
import ApplicationShell from './pages/ApplicationShell';
import HomePage from './pages/homepage';
import PrivateRoute from './components/appli/PrivateRoute';

import 'leaflet/dist/leaflet.css';
import './App.css';

const Api = lazy(() => import('./components/appli/Api'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ApiDoc = lazy(() => import('./pages/ApiDoc'));
const DocumentDetails = lazy(() => import('./pages/DocumentDetails'));
const DuplicateImportHandle = lazy(
  () => import('./pages/DuplicateImportHandle')
);
const Faq = lazy(() => import('./components/appli/Faq'));
const LatestBlogNewsSection = lazy(
  () => import('./pages/homepage/LatestBlogNewsSection')
);
const ChangePassword = lazy(() => import('./components/appli/ChangePassword'));
const SignUp = lazy(() => import('./components/appli/SignUp'));
const ForgotPassword = lazy(() => import('./components/appli/ForgotPassword'));
const AccountPage = lazy(() => import('./pages/Account'));
const ContributionsPage = lazy(() => import('./pages/Contributions'));
const RecentChangesPage = lazy(() => import('./pages/RecentChanges'));
const DocumentValidation = lazy(() => import('./pages/DocumentValidation'));
const DocumentEdit = lazy(() => import('./pages/DocumentEdit'));
const EntityCreation = lazy(() => import('./pages/EntityCreation'));
const EntityPicker = lazy(() => import('./pages/EntityCreation/EntityPicker'));
const AddGuideline = lazy(() => import('./pages/EntityCreation/AddGuideline'));
const AddEntrance = lazy(() => import('./pages/EntityCreation/AddEntrance'));
const AddDocument = lazy(() => import('./pages/EntityCreation/AddDocument'));
const AddMassif = lazy(() => import('./pages/EntityCreation/AddMassif'));
const AddOrganization = lazy(
  () => import('./pages/EntityCreation/AddOrganization')
);
const EntryPage = lazy(() => import('./pages/Entry'));
const ImportContainer = lazy(() => import('./pages/ImportCSV'));
const ImportObservationsPage = lazy(
  () => import('./pages/ImportObservationsPage')
);
const ManageUsers = lazy(() => import('./pages/Admin/ManageUsers'));
const Map = lazy(() => import('./pages/Map'));
const MassifPage = lazy(() => import('./pages/Massif'));
const MoveEntranceToCave = lazy(() => import('./pages/MoveEntranceToCave'));
const NetworkPage = lazy(() => import('./pages/Network'));
const PersonPage = lazy(() => import('./pages/Person'));
const OrganizationPage = lazy(() => import('./pages/Organization'));
const EntranceEdit = lazy(
  () => import('./pages/EntityEdit/Entrance/EntranceEdit')
);
const MassifEdit = lazy(() => import('./pages/EntityEdit/Massif/MassifEdit'));
const PersonEdit = lazy(() => import('./pages/PersonEdit'));
const OrganizationEdit = lazy(
  () => import('./pages/EntityEdit/Organization/OrganizationEdit')
);
const CountryPage = lazy(() => import('./pages/Country'));
const RegionPage = lazy(() => import('./pages/Region'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));
const GuidelinesPage = lazy(() => import('./pages/Guidelines'));
const GuidelinePage = lazy(() => import('./pages/Guideline'));
const GuidelineEdit = lazy(() => import('./pages/GuidelineEdit'));
const MessagesPage = lazy(() => import('./pages/Messages'));
const SnapshotPage = lazy(() => import('./components/appli/Entry/Snapshots'));
const EntrancesListPage = lazy(() => import('./pages/EntrancesList'));
const CountryListPage = lazy(() => import('./pages/CountryList'));
const EntrancesSearchPage = lazy(() => import('./pages/Entrances'));
const DocumentsSearchPage = lazy(() => import('./pages/Documents'));
const MassifsSearchPage = lazy(() => import('./pages/Massifs'));
const OrganizationsSearchPage = lazy(() => import('./pages/Organizations'));
const PersonsSearchPage = lazy(() => import('./pages/Persons'));
const VerifyEmail = lazy(() => import('./containers/VerifyEmail'));

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<ApplicationShell />}>
      <Route exact path="/" element={<HomePage />} />
      <Route exact path="/ui" element={<Navigate to="/" replace />} />
      <Route path="/ui/dashboard" element={<Dashboard />} />
      <Route path="/ui/admin/users" element={<ManageUsers />} />
      <Route path="/ui/entrances" element={<EntrancesSearchPage />} />
      <Route path="/ui/documents" element={<DocumentsSearchPage />} />
      <Route path="/ui/massifs" element={<MassifsSearchPage />} />
      <Route path="/ui/organizations" element={<OrganizationsSearchPage />} />
      <Route path="/ui/persons" element={<PersonsSearchPage />} />
      <Route path="/ui/api/:version" element={<ApiDoc />} />
      <Route path="/ui/api" element={<Api />} />
      <Route path="/ui/:type/:id/snapshots" element={<SnapshotPage />} />
      <Route path="/ui/entrances/:id?/move" element={<MoveEntranceToCave />} />
      <Route path="/ui/entrances/:entranceId?" element={<EntryPage />} />
      <Route path="/ui/caves/:caveId?" element={<NetworkPage />} />
      <Route
        path="/ui/countries/:countryId/entrances"
        element={<EntrancesListPage />}
      />
      <Route
        path="/ui/countries/:countryId/regions/:regionId/entrances"
        element={<EntrancesListPage />}
      />
      <Route
        path="/ui/countries/:countryId/regions/:regionId"
        element={<RegionPage />}
      />
      <Route path="/ui/countries/:id" element={<CountryPage />} />
      <Route path="/ui/countries" element={<CountryListPage />} />
      <Route path="/ui/faq" element={<Faq />} />
      <Route path="/ui/map/:target?" element={<Map />} />
      <Route path="/ui/contributions" element={<ContributionsPage />} />
      <Route path="/ui/changes/recent" element={<RecentChangesPage />} />
      <Route path="/ui/notifications" element={<NotificationsPage />} />
      <Route path="/ui/guidelines" element={<GuidelinesPage />} />
      <Route path="/ui/guidelines/:guidelineId" element={<GuidelinePage />} />
      <Route path="/ui/messages" element={<MessagesPage />} />
      <Route path="/ui/messages/:conversationId" element={<MessagesPage />} />
      <Route path="/ui/test" element={<LatestBlogNewsSection />} />
      <Route
        path="/ui/organizations/:organizationId"
        element={<OrganizationPage />}
      />
      <Route
        path="/ui/massifs/:massifId/entrances"
        element={<EntrancesListPage />}
      />
      <Route path="/ui/massifs/:massifId" element={<MassifPage />} />
      <Route path="/ui/persons/:personId" element={<PersonPage />} />
      <Route path="/ui/login" element={<HomePage />} />
      <Route path="/ui/signup" element={<SignUp />} />
      <Route path="/ui/verify-email" element={<VerifyEmail />} />
      <Route path="/ui/entity/add" element={<EntityCreation />}>
        <Route index element={<EntityPicker />} />
        <Route path="entrance" element={<AddEntrance />} />
        <Route path="document" element={<AddDocument />} />
        <Route path="massif" element={<AddMassif />} />
        <Route path="organization" element={<AddOrganization />} />
        <Route path="guideline" element={<AddGuideline />} />
      </Route>
      <Route path="/ui/forgotPassword" element={<ForgotPassword />} />
      <Route path="/ui/changePassword" element={<ChangePassword />} />
      <Route path="/ui/documents/validation" element={<DocumentValidation />} />
      <Route path="/ui/documents/:documentId" element={<DocumentDetails />} />
      <Route path="/ui/import-csv" element={<ImportContainer />} />
      <Route path="/ui/duplicates" element={<DuplicateImportHandle />} />

      {/* Routes requiring authentication */}
      <Route element={<PrivateRoute />}>
        <Route path="/ui/account" element={<AccountPage />} />
        <Route
          path="/ui/observations/import"
          element={<ImportObservationsPage />}
        />
        <Route
          path="/ui/entrances/:entranceId/edit"
          element={<EntranceEdit />}
        />
        <Route
          path="/ui/organizations/:organizationId/edit"
          element={<OrganizationEdit />}
        />
        <Route path="/ui/massifs/:massifId/edit" element={<MassifEdit />} />
        <Route path="/ui/persons/:personId/edit" element={<PersonEdit />} />
        <Route
          path="/ui/documents/:documentId/edit"
          element={<DocumentEdit />}
        />
        <Route
          path="/ui/guidelines/:guidelineId/edit"
          element={<GuidelineEdit />}
        />
      </Route>

      <Route path="/ui/*" element={<Navigate to="/" replace />} />
    </Route>
  ),
  {
    // Opt into React Router v7 behaviour ahead of the v8 migration.
    // These flags eliminate the deprecation warnings that would otherwise fire
    // when upgrading, and let us test v7 semantics incrementally.
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true
    }
  }
);

const App = () => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={grottoTheme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  </StyledEngineProvider>
);

export default App;
