import React, { useMemo } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Box, Tooltip, IconButton } from '@mui/material';

import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import {
  CaveCard,
  EntranceCard,
  OrganizationCard,
  PersonCard
} from './EntitiesListItem';

const EntitiesList = ({
  type,
  entities = [],
  onItemRemove,
  emptyMessage = null,
  toolTipTitle = 'Remove'
}) => {
  const { formatMessage } = useIntl();
  const compareKey = type === 'person' ? 'nickname' : 'name';
  const sorted = useMemo(
    () => entities.slice().sort((a, b) => (a[compareKey] ?? '').localeCompare(b[compareKey] ?? '')),
    [entities, compareKey]
  );

  if (!emptyMessage && entities.length === 0) return null;

  const itemAction = onItemRemove
    ? e => (
        <Tooltip title={toolTipTitle} disableTouchListener>
          <IconButton
            onClick={() => onItemRemove(e.id)}
            color="error"
            sx={{ touchAction: 'manipulation' }}>
            <RemoveCircleIcon />
          </IconButton>
        </Tooltip>
      )
    : () => null;

  const cardConfig = {
    cave: { Component: CaveCard, props: e => ({ cave: e, itemActionButton: itemAction(e) }) },
    person: { Component: PersonCard, props: e => ({ person: e, itemActionButton: itemAction(e) }) },
    entrance: {
      Component: EntranceCard,
      props: e => ({
        link: `/ui/entrances/${e.id}`,
        label: e.name ?? <i>{formatMessage({ id: 'no name' })}</i>,
        itemActionButton: itemAction(e)
      })
    },
    organization: { Component: OrganizationCard, props: e => ({ organization: e, itemActionButton: itemAction(e) }) }
  };
  const { Component: ListItemComponent, props: listItemProps } = cardConfig[type];

  return entities.length > 0 ? (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: { xs: 1, md: 2 }
      }}>
      {sorted.map(e => (
        <ListItemComponent key={e.id} {...listItemProps(e)} />
      ))}
    </Box>
  ) : (
    emptyMessage
  );
};

EntitiesList.propTypes = {
  entities: PropTypes.arrayOf(PropTypes.shape({})),
  type: PropTypes.oneOf(['cave', 'person', 'entrance', 'organization']),
  emptyMessage: PropTypes.node,
  toolTipTitle: PropTypes.string,
  onItemRemove: PropTypes.func
};

export default EntitiesList;
