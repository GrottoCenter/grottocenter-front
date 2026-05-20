import React, { useEffect, useState } from 'react';
import {
  Box,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup
} from '@mui/material';
import { useIntl } from 'react-intl';
import { useController, useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import Alert from '../../common/Alert';
import CaveAutoCompleteSearch from '../../common/AutoCompleteSearch/CaveAutoCompleteSearch';
import Header from './Header';
import { moveEntranceToCave } from '../../../actions/MoveEntranceToCave';
import { EntranceType } from './types';
import OperationSummary from './OperationSummary';
import FormActions from './FormActions';
import DetachEntranceSection from './DetachEntranceSection';
import { useNotification } from '../../../hooks/useNotification';

const MODE_MOVE = 'move';
const MODE_DETACH = 'detach';

const marginBetweenComponents = 4;

const MoveEntranceToCaveForm = ({ entrance }) => {
  const [mode, setMode] = useState(MODE_MOVE);
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
  const navigate = useNavigate();
  const { onSuccess } = useNotification();
  const { loading, error: apiError } = useSelector(
    state => state.moveEntranceToCave
  );

  useEffect(() => {
    if (isSubmitSuccessful && !loading && !apiError) {
      onSuccess(
        formatMessage({ id: 'Entrance successfully moved.' })
      );
      navigate(`/ui/entrances/${entrance.id}`);
    }
  }, [isSubmitSuccessful, loading, apiError, navigate, entrance.id, onSuccess, formatMessage, newCave]);

  if (!entrance) return null;

  const isLinkedToANetwork = entrance.cave?.entrances?.length > 1;

  const handleOnSelection = selectedCave => {
    onNewCaveChange({ ...selectedCave, id: Number(selectedCave.id) });
  };
  const handleResetCave = () => reset();

  const onSubmitMoveCave = () => {
    if (!newCave) return;
    dispatch(moveEntranceToCave(entrance.id, newCave.id));
  };

  return (
    <Box>
      <Box mb={marginBetweenComponents}>
        <Header entrance={entrance} />
      </Box>

      <Divider />

      <FormControl component="fieldset" sx={{ mb: marginBetweenComponents, mt: marginBetweenComponents }}>
        <FormLabel component="legend">
          {formatMessage({ id: 'What do you want to do?' })}
        </FormLabel>
        <RadioGroup
          value={mode}
          onChange={e => setMode(e.target.value)}>
          <FormControlLabel
            value={MODE_MOVE}
            control={<Radio />}
            label={formatMessage({ id: 'Link to another network' })}
          />
          <FormControlLabel
            value={MODE_DETACH}
            control={<Radio />}
            label={formatMessage({ id: 'Detach from current network' })}
          />
        </RadioGroup>
      </FormControl>

      {mode === MODE_MOVE && (
        <>
          <Box mb={marginBetweenComponents}>
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
                id: 'The entrance is the only one of the cave. Moving it to another existing cave or network will result in deleting it and losing its cave data (depth, discovery year, length, temperature, locations etc.): be careful!'
              })}
            />
          )}

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
        </>
      )}

      {mode === MODE_DETACH && (
        <DetachEntranceSection entrance={entrance} />
      )}
    </Box>
  );
};

MoveEntranceToCaveForm.propTypes = {
  entrance: EntranceType.isRequired
};

export default MoveEntranceToCaveForm;
