import React from 'react';
import { Box, Divider } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { useController, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';

import Alert from '../../common/Alert';
import CaveAutoCompleteSearch from '../../common/AutoCompleteSearch/CaveAutoCompleteSearch';
import Header from './Header';
import { moveEntranceToCave } from '../../../actions/MoveEntranceToCave';
import { EntranceType } from './types';
import OperationSummary from './OperationSummary';
import FormActions from './FormActions';

const marginBetweenComponents = 4;

const MoveEntranceToCaveForm = ({ entrance }) => {
  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitSuccessful }
  } = useForm({
    defaultValues: {
      newCave: null
    }
  });
  const {
    field: { onChange: onNewCaveChange, value: newCave }
  } = useController({
    control,
    name: 'newCave'
  });

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const { loading, error: apiError } = useSelector(
    state => state.moveEntranceToCave
  );
  const isLinkedToANetwork = entrance.cave.entrances.length > 1;

  const handleOnSelection = selectedCave => {
    onNewCaveChange({ ...selectedCave, id: Number(selectedCave.id) });
  };
  const handleResetCave = () => reset();

  const onSubmitMoveCave = () => {
    dispatch(moveEntranceToCave(entrance.id, newCave.id));
  };

  return (
    <Box>
      <Box mb={marginBetweenComponents}>
        <Header entrance={entrance} />
      </Box>

      <Divider />

      <Box mt={marginBetweenComponents} mb={marginBetweenComponents}>
        <OperationSummary
          entrance={entrance}
          newCave={newCave}
          isLinkedToANetwork={isLinkedToANetwork}
        />
      </Box>

      {!isLinkedToANetwork && (
        <Alert
          severity="warning"
          content={formatMessage({
            id:
              'The entrance is the only one of the cave. Moving it to another existing cave or network will result in deleting it and losing its cave data (depth, discovery year, length, temperature, locations etc.): be careful!'
          })}
        />
      )}

      {!loading && !apiError && isSubmitSuccessful ? (
        <Alert
          content={formatMessage(
            {
              id:
                'Entrance successfully moved from {intialCave} to {finalCave}!',
              defaultMessage:
                'Entrance successfully moved from {intialCave} to {finalCave}!'
            },
            {
              intialCave: <b>{entrance.cave.name}</b>,
              finalCave: <b>{newCave.name}</b>
            }
          )}
        />
      ) : (
        <form autoComplete="off" onSubmit={handleSubmit(onSubmitMoveCave)}>
          <CaveAutoCompleteSearch
            onSelection={handleOnSelection}
            value={newCave}
          />
          <FormActions
            entrance={entrance}
            loading={loading}
            newCave={newCave}
            onReset={handleResetCave}
          />
        </form>
      )}
    </Box>
  );
};

MoveEntranceToCaveForm.propTypes = {
  entrance: EntranceType
};

export default MoveEntranceToCaveForm;
