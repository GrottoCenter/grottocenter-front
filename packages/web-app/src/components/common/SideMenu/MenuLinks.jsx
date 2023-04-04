import React from 'react';
import { List } from '@material-ui/core';
import LibraryAddIcon from '@material-ui/icons/LibraryAdd';
import DashboardIcon from '@material-ui/icons/Dashboard';
import MapIcon from '@material-ui/icons/Map';
import SearchIcon from '@material-ui/icons/Search';
import { FlagRounded } from '@material-ui/icons';
import Item, { DocumentItems } from './Items';

import { usePermissions } from '../../../hooks';

const MenuLinks = () => {
  const permissions = usePermissions();
  return (
    <List component="nav" aria-label="main mailbox folders">
      <Item
        ItemIcon={() => <MapIcon color="primary" />}
        label="Map"
        href="/ui/map"
      />
      <Item
        ItemIcon={() => <SearchIcon color="primary" />}
        label="Advanced search"
        href="/ui/search"
      />
      <Item
        ItemIcon={() => <LibraryAddIcon color="primary" />}
        label="Contribute"
        href="/ui/entity/add"
      />
      <DocumentItems
        isModerator={permissions.isModerator}
        isUser={permissions.isUser}
      />
      {permissions.isAuth && (
        <Item
          ItemIcon={() => <DashboardIcon color="primary" />}
          label="Dashboard"
          href="/ui"
        />
      )}
      <Item
        ItemIcon={() => <FlagRounded color="primary" />}
        label="Countries"
        href="/ui/countries"
      />
    </List>
  );
};

export default MenuLinks;
