import React from 'react';
import { useIntl } from 'react-intl';
import { List } from '@mui/material';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import { FlagRounded } from '@mui/icons-material';
import Item from './Items';

import { usePermissions } from '../../../hooks';

const MenuLinks = () => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  return (
    <List
      component="nav"
      aria-label={formatMessage({ id: 'main mailbox folders' })}>
      <Item
        ItemIcon={() => <MapIcon color="primary" />}
        label={formatMessage({ id: 'Map' })}
        href="/ui/map"
      />
      <Item
        ItemIcon={() => <SearchIcon color="primary" />}
        label={formatMessage({ id: 'Advanced search' })}
        href="/ui/search"
      />
      <Item
        ItemIcon={() => <LibraryAddIcon color="primary" />}
        label={formatMessage({ id: 'Contribute' })}
        href="/ui/entity/add"
      />
      {permissions.isAuth && (
        <Item
          ItemIcon={() => <DashboardIcon color="primary" />}
          label={formatMessage({ id: 'Dashboard' })}
          href="/ui"
        />
      )}
      <Item
        ItemIcon={() => <FlagRounded color="primary" />}
        label={formatMessage({ id: 'Countries' })}
        href="/ui/countries"
      />
    </List>
  );
};

export default MenuLinks;
