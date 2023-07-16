import { useIntl } from 'react-intl';
import { Box, Button, ButtonGroup, Tooltip } from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { useDispatch } from 'react-redux';
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
    <Box key={rigging.id} position="relative" mt={2}>
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end'
        }}>
        <ButtonGroup color="primary">
          <Tooltip
            title={
              isFormVisible
                ? formatMessage({ id: 'Cancel edit' })
                : formatMessage({ id: 'Edit these riggings' })
            }>
            <Button
              disabled={!permissions.isAuth}
              onClick={() => setIsFormVisible(!isFormVisible)}
              color="primary"
              aria-label="edit">
              {isFormVisible ? formatMessage({ id: `Cancel` }) : <EditIcon />}
            </Button>
          </Tooltip>
          {!isFormVisible && (
            <SnapshotButton id={rigging.id} type="riggings" content={rigging} />
          )}
        </ButtonGroup>
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
