import React, { useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Redirect, Route, Switch } from 'react-router-dom';

import Api from '../components/appli/Api';
import Dashboard from './Dashboard';
import ApiDoc from './ApiDoc';
import HomePage from './homepage';
import AdvancedSearchPage from './AdvancedSearchPage';
import DocumentDetailsPage from './DocumentDetails';
import DuplicateImportHandle from './DuplicateImportHandle';
import Faq from '../components/appli/Faq';
import LatestBlogNewsSection from './homepage/LatestBlogNewsSection';
import Layout from '../components/common/Layouts/Main';

import AppBar from '../components/appli/AppBar';
import ChangePassword from '../components/appli/ChangePassword';
import LoginDialog from '../components/appli/Login';
import QuickSearch from '../components/appli/QuickSearch';
import SignUp from '../components/appli/SignUp';
import ForgotPassword from '../components/appli/ForgotPassword';

import { usePermissions } from '../hooks';

import ContributionsPage from './Contributions';
import DocumentValidation from './DocumentValidation';
import DocumentEdit from './DocumentEdit';
import EntityCreation from './EntityCreation';
import EntryPage from './Entry';
import ImportContainer from './ImportCSV';
import ManageUsers from './Admin/ManageUsers';
import Map from './Map';
import MassifPage from './Massif';
import MoveEntranceToCave from './MoveEntranceToCave';
import NetworkPage from './Network';
import PersonPage from './Person';
import OrganizationPage from './Organization';
import MassifEdit from './EntityEdit/Massif/MassifEdit';
import PersonEdit from './PersonEdit';
import OrganizationEdit from './EntityEdit/Organization/OrganizationEdit';
import CountryPage from './Country';
import NotificationsPage from './Notifications';
import SnapshotPage from '../components/appli/Entry/Snapshots';
import EntrancesListPage from './EntrancesList';
import CountryListPage from './CountryList';

async function transitionToReact() {
  await intlBootstrap.initialFetchP; // Make sure strings of the initial locale are loaded

  const loaderEl = document.querySelector('.loader');
  loaderEl.classList.add('loaderOff');
  document.querySelector('#root').classList.add('rootDisplay');
  setTimeout(() => {
    // Remove the loader element after the opacity transition
    loaderEl.remove();
  }, 410);
}

const Application = () => {
  const dispatch = useDispatch();
  const isSideMenuOpen = useSelector(state => state.sideMenu.open);
  const permissions = usePermissions();
  const toggleSideMenu = () => dispatch({ type: 'TOGGLE_SIDEMENU' });

  const firstRender = useRef(true);
  useEffect(() => {
    if (!firstRender.current) return;
    transitionToReact();
    firstRender.current = false;
  });

  return (
    <Layout
      AppBar={() => (
        <AppBar
          isSideMenuOpen={isSideMenuOpen}
          toggleSideMenu={toggleSideMenu}
          HeaderQuickSearch={() => <QuickSearch hasFixWidth={false} />}
        />
      )}
      isAuth={permissions.isAuth}
      isSideMenuOpen={isSideMenuOpen}
      toggleSideMenu={toggleSideMenu}
      SideBarQuickSearch={() => <QuickSearch />}>
      <LoginDialog />
      <Switch>
        <Route exact path="/" component={HomePage} />
        <Route exact path="/ui" component={Dashboard} />
        <Route path="/ui/admin/users" component={ManageUsers} />
        <Route path="/ui/search" component={AdvancedSearchPage} />
        <Route path="/ui/api/:version" component={ApiDoc} />
        <Route path="/ui/api" component={Api} />
        <Route path="/ui/:type/:id/snapshots" component={SnapshotPage} />
        <Route path="/ui/entrances/:id?/move" component={MoveEntranceToCave} />
        <Route path="/ui/entrances/:id?" component={EntryPage} />
        <Route path="/ui/caves/:id?" component={NetworkPage} />
        <Route
          path="/ui/countries/:countryId/entrances"
          component={EntrancesListPage}
        />
        <Route path="/ui/countries/:id" component={CountryPage} />
        <Route path="/ui/countries" component={CountryListPage} />
        <Route path="/ui/faq" component={Faq} />
        <Route path="/ui/map/:target?" component={Map} />
        <Route path="/ui/contributions" component={ContributionsPage} />
        <Route path="/ui/notifications" component={NotificationsPage} />
        <Route path="/ui/test" component={LatestBlogNewsSection} />
        <Route
          path="/ui/organizations/:organizationId/edit"
          component={OrganizationEdit}
        />
        <Route
          path="/ui/organizations/:organizationId"
          component={OrganizationPage}
        />

        <Route path="/ui/massifs/:massifId/edit" component={MassifEdit} />
        <Route
          path="/ui/massifs/:massifId/entrances"
          component={EntrancesListPage}
        />
        <Route path="/ui/massifs/:massifId" component={MassifPage} />
        <Route path="/ui/persons/:personId/edit" component={PersonEdit} />
        <Route path="/ui/persons/:personId" component={PersonPage} />
        <Route path="/ui/login" component={HomePage} />
        <Route path="/ui/signup" component={SignUp} />
        <Route path="/ui/entity/add" component={EntityCreation} />
        <Route path="/ui/forgotPassword" component={ForgotPassword} />
        <Route path="/ui/changePassword" component={ChangePassword} />
        <Route path="/ui/documents/validation" component={DocumentValidation} />
        <Route path="/ui/documents/:documentId/edit" component={DocumentEdit} />
        <Route
          path="/ui/documents/:documentId"
          component={DocumentDetailsPage}
        />
        <Route path="/ui/import-csv" component={ImportContainer} />
        <Route path="/ui/duplicates" component={DuplicateImportHandle} />
        <Redirect path="/ui/*" to="/ui" />
      </Switch>
    </Layout>
  );
};

export default Application;
