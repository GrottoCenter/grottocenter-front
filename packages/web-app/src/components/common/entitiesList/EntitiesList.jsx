import React from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { List, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
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
  emptyMessage = null,
  hasDivider = false
}) => {
  const { formatMessage } = useIntl();
  if (!emptyMessage && (!entites || entites.length === 0)) return false;

  let compareKey = 'name';
  let ListItemComponent = DefaultListItem;
  let listItemProps = () => ({});
  if (type === 'cave') {
    ListItemComponent = CaveListItem;
    listItemProps = e => ({ cave: e });
  } else if (type === 'user') {
    compareKey = 'nickname';
    listItemProps = e => ({ link: `/ui/persons/${e.id}`, label: e.nickname });
  } else if (type === 'entrance') {
    listItemProps = e => ({
      link: `/ui/entrances/${e.id}`,
      label: e.name ?? <i>{formatMessage({ id: 'no name' })}</i>,
      isMultiline: true
    });
  } else if (type === 'organization') {
    listItemProps = e => ({
      link: `/ui/organizations/${e.id}`,
      label: e.name,
      isMultiline: true
    });
  }
  // For documents use the <DocumentsList> elements

  return (
    <>
      <Typography variant="h3" gutterBottom>
        {title}
      </Typography>
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
  type: PropTypes.oneOf(['cave', 'user', 'entrance', 'organization']),
  title: PropTypes.node.isRequired,
  emptyMessage: PropTypes.node,
  hasDivider: PropTypes.bool
};

export default EntitiesList;
