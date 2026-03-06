import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Link } from 'react-router-dom';
import LibraryAddIcon from '@mui/icons-material/LibraryAdd';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import { FlagRounded } from '@mui/icons-material';

import Translate from '../Translate';

export const LinkedItem = ({ href = '', ItemIcon, label, onClick }) => (
  <ListItemButton
    component={React.forwardRef((props, ref) => (
      <Link {...props} to={href} ref={ref} />
    ))}
    onClick={onClick}>
    <ListItemIcon>
      <ItemIcon />
    </ListItemIcon>
    <ListItemText>
      <Translate>{label}</Translate>
    </ListItemText>
  </ListItemButton>
);

LinkedItem.propTypes = {
  href: PropTypes.string,
  ItemIcon: PropTypes.func,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

const MenuLinks = ({ isAuth, toggle }) => {
  const { formatMessage } = useIntl();
  return (
    <List
      component="nav"
      aria-label={formatMessage({ id: 'main mailbox folders' })}>
      <LinkedItem
        ItemIcon={() => <MapIcon color="primary" />}
        label={formatMessage({ id: 'Map' })}
        href="/ui/map"
        onClick={toggle}
      />
      <LinkedItem
        ItemIcon={() => <SearchIcon color="primary" />}
        label={formatMessage({ id: 'Advanced search' })}
        href="/ui/search"
        onClick={toggle}
      />
      <LinkedItem
        ItemIcon={() => <LibraryAddIcon color="primary" />}
        label={formatMessage({ id: 'Contribute' })}
        href="/ui/entity/add"
        onClick={toggle}
      />
      {isAuth && (
        <LinkedItem
          ItemIcon={() => <DashboardIcon color="primary" />}
          label={formatMessage({ id: 'Dashboard' })}
          href="/ui"
          onClick={toggle}
        />
      )}
      <LinkedItem
        ItemIcon={() => <FlagRounded color="primary" />}
        label={formatMessage({ id: 'Countries' })}
        href="/ui/countries"
        onClick={toggle}
      />
    </List>
  );
};
MenuLinks.propTypes = {
  isAuth: PropTypes.bool.isRequired,
  toggle: PropTypes.func
};

export default MenuLinks;
