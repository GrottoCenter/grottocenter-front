import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Button, Divider, List, Tooltip } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { LocationPropTypes } from '../../../../types/entrance.type';
import Location from './Location';
import CreateLocationForm from '../../EntitiesForm/Location';
import { postLocation } from '../../../../actions/Location/CreateLocation';
import { moveLocationRelevance } from '../../../../actions/Location/MoveRelevance';
import { usePermissions } from '../../../../hooks';
import { useMoveRelevanceWithUndo } from '../../../../hooks/useMoveRelevanceWithUndo';
import { sortByRelevance } from '../../../../helpers/sortByRelevance';
import Alert from '../../../common/Alert';

const Locations = ({ entranceId, locations, isSensitive, isEditAllowed }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const { movingId, handleMove } = useMoveRelevanceWithUndo(
    moveLocationRelevance
  );

  const onSubmitForm = data => {
    dispatch(
      postLocation({
        entrance: entranceId,
        title: data.title,
        body: data.body,
        language: data.language
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      anchorId="location"
      defaultExpanded={locations.length > 0}
      title={formatMessage({ id: 'Location' })}
      icon={
        permissions.isAuth &&
        isEditAllowed &&
        (!isSensitive || permissions.isAdmin) && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel adding a new location' })
                : formatMessage({ id: 'Add a new location' })
            }>
            <Button
              color={isFormVisible ? 'inherit' : 'secondary'}
              size="small"
              variant="outlined"
              onClick={() => setIsFormVisible(!isFormVisible)}
              startIcon={isFormVisible ? <CancelIcon /> : <AddCircleIcon />}>
              {formatMessage({ id: isFormVisible ? 'Cancel' : 'New' })}
            </Button>
          </Tooltip>
        )
      }
      content={
        <>
          {isFormVisible && (
            <>
              <CreateLocationForm isNewLocation onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {locations.length > 0 ? (
            <List dense disablePadding>
              {(() => {
                const sorted = sortByRelevance(locations);
                const activeIds = sorted
                  .filter(l => !l.isDeleted)
                  .map(l => l.id);
                return sorted.map(location => (
                  <React.Fragment key={location.id}>
                    <Location
                      location={location}
                      isEditAllowed={isEditAllowed}
                      isMoving={movingId === location.id}
                      onMoveUp={() => handleMove(location.id, -1)}
                      onMoveDown={() => handleMove(location.id, 1)}
                      isFirst={location.id === activeIds[0]}
                      isLast={location.id === activeIds[activeIds.length - 1]}
                    />
                  </React.Fragment>
                ));
              })()}
            </List>
          ) : (
            <Alert
              severity={isSensitive ? 'warning' : 'info'}
              content={formatMessage({
                id: isSensitive
                  ? 'This entrance has a restricted access, you can not see its locations.'
                  : 'There is currently no location for this entrance.'
              })}
            />
          )}
        </>
      }
    />
  );
};

Locations.propTypes = {
  entranceId: PropTypes.number.isRequired,
  locations: PropTypes.arrayOf(LocationPropTypes),
  isSensitive: PropTypes.bool,
  isEditAllowed: PropTypes.bool
};

export default Locations;
