import { useEffect } from 'react';
import { useIntl } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import Alert from '../../common/Alert';
import { useDetachEntranceToNewCave } from '../../../hooks';
import { useNotification } from '../../../hooks/useNotification';
import { EntranceType } from './types';
import OperationSummary from './OperationSummary';
import FormActions from './FormActions';

const DetachEntranceSection = ({ entrance }) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { onSuccess } = useNotification();
  const detachMutation = useDetachEntranceToNewCave();
  const loading = detachMutation.isPending;
  const { error } = detachMutation;
  const success = detachMutation.isSuccess;

  const isSoleEntrance =
    !entrance.cave?.entrances || entrance.cave.entrances.length === 1;

  useEffect(() => {
    if (success) {
      onSuccess(formatMessage({ id: 'Entrance successfully detached.' }));
      navigate(`/ui/entrances/${entrance.id}`);
    }
  }, [success, navigate, entrance.id, onSuccess, formatMessage]);

  const handleDetach = () => detachMutation.mutate(entrance);

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
