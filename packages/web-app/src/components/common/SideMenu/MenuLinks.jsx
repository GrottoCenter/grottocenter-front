import React from 'react';
import { List } from '@mui/material';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import LocationIcon from '@mui/icons-material/LocationOn';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import Item, { DocumentItems } from './Items';

import { usePermissions } from '../../../hooks';

const MenuLinks = () => {
  const permissions = usePermissions();
  return (
    <List component="nav" aria-label="main mailbox folders">
      <Item
        ItemIcon={() => <HomeIcon color="primary" />}
        label="Home page"
        href="/"
      />
      {permissions.isAuth && (
        <Item
          ItemIcon={() => <DashboardIcon color="primary" />}
          label="Dashboard"
          href="/ui"
        />
      )}
      <Item
        ItemIcon={() => <SearchIcon color="primary" />}
        label="Advanced search"
        href="/ui/search"
      />
      <Item
        ItemIcon={() => <LocationIcon color="primary" />}
        label="Map"
        href="/ui/map"
      />
      {permissions.isAuth && (
        <Item
          ItemIcon={() => <LibraryAddIcon color="primary" />}
          label="Create new entity"
          href="/ui/entity/add"
        />
      )}
      <DocumentItems
        isModerator={permissions.isModerator}
        isUser={permissions.isUser}
      />
    </List>
  );
};

export default MenuLinks;
