import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { List, Typography, Tooltip, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import { CaveListItem, DefaultListItem } from './EntitiesListItem';

const StyledList = styled(List)({
  display: 'flex',
  flexWrap: 'wrap',
  width: '100%'
});

const EntitiesList = ({
  type,
  entites = [],
  title,
  actionButton,
  onItemRemove,
  emptyMessage = null,
  hasDivider = false
}) => {
  const { formatMessage } = useIntl();
  if (!emptyMessage && (!entites || entites.length === 0)) return null;

  let listItemProps = () => ({});
  let compareKey = 'name';
  let ListItemComponent = DefaultListItem;
  let itemAction = () => null;
    if (onItemRemove) {
      itemAction = e => (
        <Tooltip title={formatMessage({ id: 'Remove from organization' })}>
          <IconButton
            size="small"
            onClick={() => onItemRemove(e.id)}
            color="error">
            <RemoveCircleIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      );
    }
  if (type === 'cave') {
    ListItemComponent = CaveListItem;
    listItemProps = e => ({ cave: e, itemActionButton: itemAction(e) });
  } else if (type === 'person') {
    compareKey = 'nickname';
    listItemProps = e => ({
      link: `/ui/persons/${e.id}`,
      label: e.nickname,
      itemActionButton: itemAction(e)
    });
  } else if (type === 'entrance') {
    listItemProps = e => ({
      link: `/ui/entrances/${e.id}`,
      label: e.name ?? <i>{formatMessage({ id: 'no name' })}</i>,
      isMultiline: true,
      itemActionButton: itemAction(e)
    });
  } else if (type === 'organization') {
    listItemProps = e => ({
      link: `/ui/organizations/${e.id}`,
      label: e.name,
      isMultiline: true,
      itemActionButton: itemAction(e)
    });
  }
  // For documents use the <DocumentsList> elements

  return (
    <>
      {(title || actionButton) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
          {title && (
            <Typography variant="h3" gutterBottom>
              {title}
            </Typography>
          )}
          {actionButton}
        </div>
      )}
      {entites && entites.length > 0 ? (
        <StyledList>
          {entites
            .sort((a, b) => a[compareKey].localeCompare(b[compareKey]))
            .map(e => (
              <ListItemComponent key={e.id} {...listItemProps(e)} />
            ))}
        </StyledList>
      ) : (
        emptyMessage
      )}
      {hasDivider && <hr />}
    </>
  );
};

EntitiesList.propTypes = {
  entites: PropTypes.arrayOf(PropTypes.shape({})),
  type: PropTypes.oneOf(['cave', 'person', 'entrance', 'organization']),
  title: PropTypes.node,
  emptyMessage: PropTypes.node,
  hasDivider: PropTypes.bool,
  actionButton: PropTypes.node,
  onItemRemove: PropTypes.func,
};

export default EntitiesList;
