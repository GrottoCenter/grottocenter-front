import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import {
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  IconButton,
  Tooltip,
  ListItemIcon
} from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import ListIcon from '@material-ui/icons/FormatListBulleted';
import MapIcon from '@material-ui/icons/Map';
import LinkIcon from '@material-ui/icons/Link';
import { includes } from 'ramda';

import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { CaveContext } from './Provider';
import CustomIcon from '../../common/CustomIcon';
import DisabledTooltip from '../../common/DisabledTooltip';

const LoadingList = () => (
  <>
    <Skeleton />
    <Skeleton />
    <Skeleton />
  </>
);

const EntrancesList = () => {
  const { formatMessage } = useIntl();
  const {
    state: { selectedEntrances, entrances, loading },
    action: { openEntranceMap, openEntranceDescription }
  } = useContext(CaveContext);

  return (
    <ScrollableContent
      title={formatMessage({ id: 'Entrances' })}
      content={
        <List dense>
          {loading ? (
            <LoadingList />
          ) : (
            entrances.map(entrance => (
              <ListItem
                key={entrance.id}
                selected={includes(entrance.id, selectedEntrances)}>
                <ListItemIcon>
                  <CustomIcon type="entrance" />
                </ListItemIcon>
                <ListItemText primary={entrance.name} />
                <ListItemSecondaryAction>
                  <DisabledTooltip disabled>
                    <span>
                      <IconButton
                        disabled
                        onClick={() => openEntranceMap(entrance.id)}
                        edge="end"
                        aria-label="entrance map">
                        <MapIcon />
                      </IconButton>
                    </span>
                  </DisabledTooltip>
                  <Tooltip title={formatMessage({ id: 'Go to description' })}>
                    <IconButton
                      onClick={() => openEntranceDescription(entrance.id)}
                      edge="end"
                      aria-label="entrance description">
                      <LinkIcon />
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>
      }
      footer={formatMessage({ id: 'Created by' })}
      icon={<ListIcon color="primary" />}
    />
  );
};

export default EntrancesList;
