import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';

import AppLink from './AppLink';

export const TextLink = ({ value, url, icon }) => {
  const label = url ? (
    <AppLink {...(url.startsWith('/ui') ? { to: url } : { href: url })}>
      {value}
    </AppLink>
  ) : (
    <Typography component="span">{value}</Typography>
  );

  if (!icon) return label;
  return (
    <>
      <Box
        component="span"
        sx={{ display: 'inline-flex', verticalAlign: 'text-bottom', mr: 0.25 }}>
        {icon}
      </Box>
      {label}
    </>
  );
};

TextLink.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  url: PropTypes.string,
  icon: PropTypes.node
};

export const ListElement = ({ icon, value, secondary, url }) => {
  if (!value) return null;
  return (
    <ListItem>
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText
        primary={<TextLink value={value} url={url} />}
        secondary={secondary}
      />
    </ListItem>
  );
};

ListElement.propTypes = {
  icon: PropTypes.node,
  value: PropTypes.string,
  secondary: PropTypes.string,
  url: PropTypes.string
};

const HorizontalList = styled(List)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: theme.spacing(-0.5),

  '& .MuiListItem-root': {
    width: 'initial'
  },

  '& .MuiListItemIcon-root': {
    minWidth: 0
  },

  '& .MuiListItemText-root': {
    marginTop: 0,
    marginBottom: 0
  },

  '& .MuiListItemText-secondary': {
    whiteSpace: 'pre-wrap'
  }
}));

const LinkedEntitiesList = ({ children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return <HorizontalList>{items}</HorizontalList>;
};

LinkedEntitiesList.propTypes = { children: PropTypes.node };

export default LinkedEntitiesList;
