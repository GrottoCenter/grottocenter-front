import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import Alert from '../../common/Alert';
import {
  detachEntranceToNewCave,
  resetDetachEntrance
} from '../../../actions/Entrance/DetachEntrance';
import { useNotification } from '../../../hooks/useNotification';
import { EntranceType } from './types';
import OperationSummary from './OperationSummary';
import FormActions from './FormActions';

const DetachEntranceSection = ({ entrance }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { onSuccess } = useNotification();
  const { loading, error, success } = useSelector(
    state => state.detachEntrance
  );

  const isSoleEntrance =
    !entrance.cave?.entrances || entrance.cave.entrances.length === 1;

  useEffect(() => () => dispatch(resetDetachEntrance()), [dispatch]);

  useEffect(() => {
    if (success) {
      onSuccess(formatMessage({ id: 'Entrance successfully detached.' }));
      navigate(`/ui/entrances/${entrance.id}`);
    }
  }, [success, navigate, entrance.id, onSuccess, formatMessage]);

  const handleDetach = () => dispatch(detachEntranceToNewCave(entrance));

  return (
    <Box>
      <Box mb={3}>
        <OperationSummary entrance={entrance} variant="detach" />
      </Box>
      {error && (
        <Alert
          severity="error"
          content={formatMessage({
            id: 'An error occurred while detaching the entrance.'
          })}
        />
      )}
      <FormActions
        confirmLabel={formatMessage({ id: 'Detach entrance' })}
        onConfirm={handleDetach}
        onCancel={() => navigate(`/ui/entrances/${entrance.id}`)}
        loading={loading}
        disabled={isSoleEntrance}
        confirmTooltip={
          isSoleEntrance
            ? formatMessage({
                id: 'Cannot detach: this entrance is the only one of its cave.'
              })
            : ''
        }
      />
    </Box>
  );
};

DetachEntranceSection.propTypes = {
  entrance: EntranceType.isRequired
};

export default DetachEntranceSection;
