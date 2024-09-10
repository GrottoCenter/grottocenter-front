import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import Skeleton from '@mui/material/Skeleton';
import { Link } from 'react-router-dom';

import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import CustomIcon from '../../common/CustomIcon';
import Alert from '../../common/Alert';
import idNameType from '../../../types/idName.type';

const LoadingList = () => (
  <>
    <Skeleton />
    <Skeleton />
    <Skeleton />
  </>
);

const EntrancesList = ({ isLoading, entrances, selectedEntrancesId }) => {
  const { formatMessage } = useIntl();

  return (
    <ScrollableContent
      title={formatMessage({ id: 'Entrances' })}
      content={
        <List dense>
          {isLoading && <LoadingList />}
          {entrances && entrances.length > 0 ? (
            entrances
              .sort((e1, e2) => e1.name.localeCompare(e2.name))
              .map(entrance => (
                <ListItemButton
                  component={React.forwardRef((props, ref) => (
                    <Link
                      {...props}
                      to={`/ui/entrances/${entrance.id}`}
                      ref={ref}
                    />
                  ))}
                  key={entrance.id}
                  selected={selectedEntrancesId.includes(entrance.id)}>
                  <ListItemIcon>
                    <CustomIcon type="entry" />
                  </ListItemIcon>
                  <ListItemText primary={entrance.name} />
                </ListItemButton>
              ))
          ) : (
            <Alert
              severity="info"
              title={formatMessage({
                id: 'There is currently no entrance for this network.'
              })}
            />
          )}
        </List>
      }
    />
  );
};

EntrancesList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  entrances: PropTypes.arrayOf(idNameType).isRequired,
  selectedEntrancesId: PropTypes.arrayOf(PropTypes.number)
};

export default EntrancesList;
