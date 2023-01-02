import React, { useState } from 'react';
import DescriptionIcon from '@mui/icons-material/Description';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { Collapse, List, ListItemIcon, ListItemText } from '@mui/material';
import DocumentList from '@mui/icons-material/PlaylistAddCheck';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import PropTypes from 'prop-types';

import { isNil } from 'ramda';
import Translate from '../Translate';
import { StyledLink, StyledListItem } from './styles';

const Item = ({
  ItemIcon,
  label,
  nested = false,
  onClick = () => {},
  children
}) => (
  <StyledListItem button $nested={nested} onClick={onClick}>
    <ListItemIcon>
      <ItemIcon />
    </ListItemIcon>
    <ListItemText>
      <Translate>{label}</Translate>
    </ListItemText>
    {!isNil(children) && children}
  </StyledListItem>
);

export const LinkedItem = ({ href = '', ...itemProps }) => (
  <StyledLink to={href}>
    <Item {...itemProps} />
  </StyledLink>
);

const AddDocument = () => (
  <LinkedItem
    ItemIcon={() => <NoteAddIcon color="primary" />}
    label="Add a BBS document"
    href="/ui/documents/add"
    nested
  />
);

export const DocumentItems = ({ isModerator = true, isUser = true }) => {
  const [isDocumentCollapsed, setIsDocumentCollapsed] = useState(false);

  const toggleIsDocumentCollapsed = () => {
    setIsDocumentCollapsed(!isDocumentCollapsed);
  };

  return (
    (isUser || isModerator) && (
      <>
        <Item
          onClick={toggleIsDocumentCollapsed}
          ItemIcon={() => <DescriptionIcon color="primary" />}
          label="Document">
          {isDocumentCollapsed ? <ExpandLess /> : <ExpandMore />}
        </Item>
        <Collapse in={isDocumentCollapsed} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {isUser && <AddDocument />}
            {isModerator && (
              <LinkedItem
                ItemIcon={() => <DocumentList color="primary" />}
                label="Document validation"
                href="/ui/documents/validation"
                nested
              />
            )}
          </List>
        </Collapse>
      </>
    )
  );
};

Item.propTypes = {
  ItemIcon: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  nested: PropTypes.bool,
  children: PropTypes.node
};

LinkedItem.propTypes = {
  href: PropTypes.string,
  ...Item.propTypes
};

DocumentItems.propTypes = {
  isModerator: PropTypes.bool,
  isUser: PropTypes.bool
};

export default LinkedItem;
