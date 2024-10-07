import React from 'react';
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
import ApplicationShell from './pages/ApplicationShell';

import Api from './components/appli/Api';
import Dashboard from './pages/Dashboard';
import ApiDoc from './pages/ApiDoc';
import HomePage from './pages/homepage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import DocumentDetails from './pages/DocumentDetails';
import DuplicateImportHandle from './pages/DuplicateImportHandle';
import Faq from './components/appli/Faq';
import LatestBlogNewsSection from './pages/homepage/LatestBlogNewsSection';
import ChangePassword from './components/appli/ChangePassword';
import SignUp from './components/appli/SignUp';
import ForgotPassword from './components/appli/ForgotPassword';
import ContributionsPage from './pages/Contributions';
import DocumentValidation from './pages/DocumentValidation';
import DocumentEdit from './pages/DocumentEdit';
import EntityCreation from './pages/EntityCreation';
import EntryPage from './pages/Entry';
import ImportContainer from './pages/ImportCSV';
import ManageUsers from './pages/Admin/ManageUsers';
import Map from './pages/Map';
import MassifPage from './pages/Massif';
import MoveEntranceToCave from './pages/MoveEntranceToCave';
import NetworkPage from './pages/Network';
import PersonPage from './pages/Person';
import OrganizationPage from './pages/Organization';
import MassifEdit from './pages/EntityEdit/Massif/MassifEdit';
import PersonEdit from './pages/PersonEdit';
import OrganizationEdit from './pages/EntityEdit/Organization/OrganizationEdit';
import CountryPage from './pages/Country';
import NotificationsPage from './pages/Notifications';
import SnapshotPage from './components/appli/Entry/Snapshots';
import EntrancesListPage from './pages/EntrancesList';
import CountryListPage from './pages/CountryList';

import './App.css';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<ApplicationShell />}>
      <Route exact path="/" element={<HomePage />} />
      <Route exact path="/ui" element={<Dashboard />} />
      <Route path="/ui/admin/users" element={<ManageUsers />} />
      <Route path="/ui/search" element={<AdvancedSearchPage />} />
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
      <Route path="/ui/countries/:id" element={<CountryPage />} />
      <Route path="/ui/countries" element={<CountryListPage />} />
      <Route path="/ui/faq" element={<Faq />} />
      <Route path="/ui/map/:target?" element={<Map />} />
      <Route path="/ui/contributions" element={<ContributionsPage />} />
      <Route path="/ui/notifications" element={<NotificationsPage />} />
      <Route path="/ui/test" element={<LatestBlogNewsSection />} />
      <Route
        path="/ui/organizations/:organizationId/edit"
        element={<OrganizationEdit />}
      />
      <Route
        path="/ui/organizations/:organizationId"
        element={<OrganizationPage />}
      />

      <Route path="/ui/massifs/:massifId/edit" element={<MassifEdit />} />
      <Route
        path="/ui/massifs/:massifId/entrances"
        element={<EntrancesListPage />}
      />
      <Route path="/ui/massifs/:massifId" element={<MassifPage />} />
      <Route path="/ui/persons/:personId/edit" element={<PersonEdit />} />
      <Route path="/ui/persons/:personId" element={<PersonPage />} />
      <Route path="/ui/login" element={<HomePage />} />
      <Route path="/ui/signup" element={<SignUp />} />
      <Route path="/ui/entity/add" element={<EntityCreation />} />
      <Route path="/ui/forgotPassword" element={<ForgotPassword />} />
      <Route path="/ui/changePassword" element={<ChangePassword />} />
      <Route path="/ui/documents/validation" element={<DocumentValidation />} />
      <Route path="/ui/documents/:documentId/edit" element={<DocumentEdit />} />
      <Route path="/ui/documents/:documentId" element={<DocumentDetails />} />
      <Route path="/ui/import-csv" element={<ImportContainer />} />
      <Route path="/ui/duplicates" element={<DuplicateImportHandle />} />
      <Route path="/ui/*" render={() => <Navigate to="/ui" replace />} />
    </Route>
  )
);

const App = () => (
  <StyledEngineProvider injectFirst>
    <CssBaseline />
    <ThemeProvider theme={grottoTheme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StyledEngineProvider>
);

export default App;
