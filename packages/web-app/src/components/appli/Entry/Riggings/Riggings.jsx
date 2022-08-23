// eslint-disable-next-line react/prop-types
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { IconButton, List, Divider } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import React, { useState } from 'react';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import RemoveCircleIcon from '@material-ui/icons/RemoveCircle';
import { usePermissions } from '../../../../hooks';
import { postRiggings } from '../../../../actions/Riggings/CreateRigging';
import CreateRiggingsForm from '../../Form/RiggingsForm/index';
import ScrollableContent from '../../../common/Layouts/Fixed/ScrollableContent';
import Rigging from './Rigging';
import { riggingsType } from '../Provider';

const Riggings = ({ riggings, entranceId }) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const onSubmitForm = data => {
    dispatch(postRiggings(data, entranceId, data.language.id, riggings.id));
    setIsFormVisible(false);
  };

  return (
    <ScrollableContent
      dense
      title={formatMessage({ id: 'Riggings' })}
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
              <CreateRiggingsForm isNewDescription onSubmit={onSubmitForm} />
              <Divider />
            </>
          )}

          <List>
            {riggings?.map((rigging, i) => (
              <Rigging riggings={riggings} rigging={rigging} index={i} />
            ))}
          </List>
        </>
      }
    />
  );
};

Riggings.propTypes = {
  riggings: riggingsType,
  entranceId: PropTypes.number.isRequired
};

export default Riggings;
