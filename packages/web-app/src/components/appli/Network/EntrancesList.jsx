import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import { List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core';
import Skeleton from '@material-ui/lab/Skeleton';
import { includes } from 'ramda';
import { Link } from 'react-router-dom';

import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { CaveContext } from './Provider';
import CustomIcon from '../../common/CustomIcon';

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
    state: { selectedEntrances, entrances, loading }
  } = useContext(CaveContext);

  return (
    <ScrollableContent
      title={formatMessage({ id: 'Entrances' })}
      content={
        <List dense>
          {loading ? (
            <LoadingList />
          ) : (
            entrances
              .sort((e1, e2) => e1.name.localeCompare(e2.name))
              .map(entrance => (
                <ListItem
                  component={React.forwardRef((props, ref) => (
                    <Link
                      {...props}
                      to={`/ui/entrances/${entrance.id}`}
                      ref={ref}
                    />
                  ))}
                  key={entrance.id}
                  selected={includes(entrance.id, selectedEntrances)}>
                  <ListItemIcon>
                    <CustomIcon type="entry" />
                  </ListItemIcon>
                  <ListItemText primary={entrance.name} />
                </ListItem>
              ))
          )}
        </List>
      }
    />
  );
};

export default EntrancesList;
