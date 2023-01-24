import { useIntl } from 'react-intl';
import { Box, IconButton, Tooltip } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useDispatch } from 'react-redux';
import CancelIcon from '@material-ui/icons/Cancel';
import React, { useState } from 'react';
import { usePermissions } from '../../../../hooks';
import { updateRiggings } from '../../../../actions/Riggings/UpdateRigging';
import CreateRiggingsForm from '../../Form/RiggingsForm/index';
import { riggingType } from '../Provider';
import Contribution from '../../../common/Contribution/Contribution';
import RiggingTable from './RiggingTable';
import { SnapshotButton } from '../Snapshots/UtilityFunction';

const Rigging = ({ rigging }) => {
  const dispatch = useDispatch();
  const permissions = usePermissions();
  const { formatMessage } = useIntl();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const onSubmitForm = data => {
    dispatch(
      updateRiggings({
        ...data,
        language: data.language.id
      })
    );
    setIsFormVisible(false);
  };

  return (
    <Box key={rigging.id} position="relative">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
        <SnapshotButton id={rigging.id} type="riggings" content={rigging} />
        {permissions.isAuth && (
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel edit' })
                : formatMessage({ id: 'Edit these riggings' })
            }>
            <IconButton
              onClick={() => setIsFormVisible(!isFormVisible)}
              color="primary"
              aria-label="edit">
              {isFormVisible ? <CancelIcon /> : <EditIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      {isFormVisible && permissions.isAuth ? (
        <Box width="100%">
          <CreateRiggingsForm
            closeForm={() => setIsFormVisible(false)}
            isNew={false}
            onSubmit={onSubmitForm}
            values={rigging}
          />
        </Box>
      ) : (
        <Box>
          <RiggingTable {...rigging} />
          <Contribution
            author={rigging.author}
            creationDate={rigging.date}
            reviewer={rigging.reviewer}
            dateReviewed={rigging.dateReviewed}
          />
        </Box>
      )}
    </Box>
  );
};

Rigging.propTypes = {
  rigging: riggingType
};

export default Rigging;
