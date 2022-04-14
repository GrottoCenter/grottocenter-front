import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Divider, IconButton, List } from '@material-ui/core';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';

import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import { locationsType } from '../Provider';
import Location from './Location';
import CreateLocationForm from '../../Form/CreateLocationForm';
import { postLocation } from '../../../../actions/CreateLocation';
import { usePermissions } from '../../../../hooks';
import Alert from '../../../common/Alert';

const Locations = ({ entranceId, locations }) => {
  const { formatMessage } = useIntl();
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);

  const onSubmitForm = data => {
    dispatch(
      postLocation({
        ...data,
        entrance: entranceId,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Location' })}
      icon={
        permissions.isAuth && (
          <IconButton
            color="primary"
            onClick={() => setIsFormVisible(!isFormVisible)}>
            {isFormVisible ? <RemoveCircleIcon /> : <AddCircleIcon />}
          </IconButton>
        )
      }
      content={
        <>
          {isFormVisible && (
            <>
              <CreateLocationForm onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          {locations.length > 0 ? (
            <List>
              {locations.map(location => (
                <React.Fragment key={location.id}>
                  <Location location={location} />
                  <Divider variant="middle" component="li" />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Alert
              severity="info"
              title={formatMessage({
                id: 'There is currently no location for this entrance.'
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
  locations: locationsType
};

export default Locations;
