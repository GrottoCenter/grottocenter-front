import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from 'react-router-dom';
import MapIcon from '@mui/icons-material/Map';
import { FlagRounded } from '@mui/icons-material';
import {
  entranceIcon,
  bibliographyIcon,
  massifIcon,
  organizationIcon,
  caverIcon
} from '../../../assets/icons';

import Translate from '../Translate';

const SectionHeader = styled(ListSubheader)(({ theme }) => ({
  fontSize: '1.15rem',
  fontWeight: 600,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  color: theme.palette.text.secondary,
  lineHeight: '2rem',
  paddingTop: theme.spacing(1)
}));

const EntityIcon = ({ src, alt }) => (
  <img src={src} alt={alt} style={{ height: 28, width: 28 }} />
);

EntityIcon.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired
};

const LinkBehavior = React.forwardRef(({ to, ...props }, ref) => (
  <Link {...props} to={to} ref={ref} />
));
LinkBehavior.displayName = 'LinkBehavior';

export const LinkedItem = ({ href = '', ItemIcon, label, onClick }) => (
  <ListItemButton
    sx={{ py: '5px' }}
    aria-label={label}
    component={LinkBehavior}
    to={href}
    onClick={onClick}>
    <ListItemIcon sx={{ minWidth: 42 }}>
      <ItemIcon />
    </ListItemIcon>
    <ListItemText primary={label} />
  </ListItemButton>
);

LinkedItem.propTypes = {
  href: PropTypes.string,
  ItemIcon: PropTypes.func,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func
};

const MenuLinks = ({ toggle }) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <List
        component="nav"
        subheader={
          <SectionHeader disableSticky>
            <Translate>Explore</Translate>
          </SectionHeader>
        }>
        <LinkedItem
          ItemIcon={() => <MapIcon color="primary" sx={{ fontSize: 28 }} />}
          label={formatMessage({ id: 'Map' })}
          href="/ui/map"
          onClick={toggle}
        />
        <LinkedItem
          ItemIcon={() => <FlagRounded color="primary" sx={{ fontSize: 28 }} />}
          label={formatMessage({ id: 'Countries' })}
          href="/ui/countries"
          onClick={toggle}
        />
      </List>
      <Divider />
      <List
        component="nav"
        sx={{ pb: 0 }}
        subheader={
          <SectionHeader disableSticky>
            <Translate>Browse</Translate>
          </SectionHeader>
        }>
        <LinkedItem
          ItemIcon={() => <EntityIcon src={entranceIcon} alt="entrance" />}
          label={formatMessage({ id: 'Entrances' })}
          href="/ui/entrances"
          onClick={toggle}
        />
        <LinkedItem
          ItemIcon={() => <EntityIcon src={massifIcon} alt="massif" />}
          label={formatMessage({ id: 'Massifs' })}
          href="/ui/massifs"
          onClick={toggle}
        />
        <LinkedItem
          ItemIcon={() => <EntityIcon src={bibliographyIcon} alt="document" />}
          label={formatMessage({ id: 'Documents' })}
          href="/ui/documents"
          onClick={toggle}
        />
        <LinkedItem
          ItemIcon={() => (
            <EntityIcon src={organizationIcon} alt="organization" />
          )}
          label={formatMessage({ id: 'Organizations' })}
          href="/ui/organizations"
          onClick={toggle}
        />
        <LinkedItem
          ItemIcon={() => <EntityIcon src={caverIcon} alt="person" />}
          label={formatMessage({ id: 'Persons' })}
          href="/ui/persons"
          onClick={toggle}
        />
      </List>
    </>
  );
};

MenuLinks.propTypes = {
  toggle: PropTypes.func
};

export default MenuLinks;
