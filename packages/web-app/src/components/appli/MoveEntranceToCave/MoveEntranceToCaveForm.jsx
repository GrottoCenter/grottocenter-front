import React, { useEffect, useState } from 'react';
import { Box, Link } from '@mui/material';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  const [searchParams, setSearchParams] = useSearchParams();
  // Single-action page: the mode comes from the entry point (the two buttons in
  // the edit page deep-link with ?mode=). No redundant in-page mode picker.
  const mode =
    searchParams.get('mode') === MODE_DETACH ? MODE_DETACH : MODE_MOVE;

  const [newCave, setNewCave] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const navigate = useNavigate();
  const { onSuccess } = useNotification();
  const { loading, error: apiError } = useSelector(
    state => state.moveEntranceToCave
  );

  useEffect(() => {
    if (hasSubmitted && !loading && !apiError) {
      // Consume the submission so a later upstream error-clear can't retrigger
      // the success navigation without a fresh submit.
      setHasSubmitted(false);
      onSuccess(formatMessage({ id: 'Entrance successfully moved.' }));
      navigate(`/ui/entrances/${entrance?.id}`);
    }
  }, [
    hasSubmitted,
    loading,
    apiError,
    navigate,
    entrance?.id,
    onSuccess,
    formatMessage
  ]);

  if (!entrance) return null;

  const sourceInNetwork = entrance.cave?.entrances?.length > 1;
  const isSameCave = newCave && Number(newCave.id) === entrance.cave?.id;
  // The outcome preview is meaningless when the target is the current cave;
  // only the "pick a different cave" error should show then.
  const targetNbEntrances =
    !isSameCave && typeof newCave?.nbEntrances === 'number'
      ? newCave.nbEntrances
      : null;

  const handleSelection = selectedCave => {
    setNewCave(
      selectedCave ? { ...selectedCave, id: Number(selectedCave.id) } : null
    );
  };

  const switchMode = target => {
    setNewCave(null);
    setSearchParams({ mode: target });
  };

  const handleValidate = () => {
    if (!newCave || isSameCave) return;
    setHasSubmitted(true);
    dispatch(moveEntranceToCave(entrance.id, newCave.id));
  };

  return (
    <Box>
      <Box mb={marginBetweenComponents}>
        <Header entrance={entrance} />

        {/* Discreet switch to the other operation, offered right under the
            subject. Detaching only makes sense for a networked entrance. */}
        {(mode === MODE_DETACH || sourceInNetwork) && (
          <Box mt={0.5}>
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() =>
                switchMode(mode === MODE_DETACH ? MODE_MOVE : MODE_DETACH)
              }
            >
              {formatMessage({
                id:
                  mode === MODE_DETACH
                    ? 'Rather link to an entrance or network?'
                    : 'Rather detach the entrance?'
              })}
            </Link>
          </Box>
        )}
      </Box>
      {mode === MODE_MOVE ? (
        <Box>
          <CaveAutoCompleteSearch
            onSelection={handleSelection}
            value={newCave}
            label={formatMessage({ id: 'Entrance or network to attach to' })}
          />

          <Box mt={marginBetweenComponents}>
            <OperationSummary
              entrance={entrance}
              newCave={newCave}
              variant="link"
            />
          </Box>

          {/* Solo entrance: moving it deletes its cave (irreversible) — warn
              on screen since it isn't part of the before → after preview. */}
          {targetNbEntrances !== null && !sourceInNetwork && (
            <Alert
              severity="warning"
              content={formatMessage({
                id: 'The entrance is the only one of the cave. Moving it to another existing cave or network will result in deleting it and losing its cave data (depth, discovery year, length, temperature, locations etc.): be careful!'
              })}
            />
          )}

          {isSameCave && (
            <Alert
              severity="error"
              content={formatMessage({
                id: 'You must select a different cave than the initial one.'
              })}
            />
          )}

          {apiError && (
            <Alert
              severity="error"
              content={formatMessage({ id: apiError.message })}
            />
          )}

          <FormActions
            confirmLabel={formatMessage({ id: 'Attach the entrance' })}
            onConfirm={handleValidate}
            onCancel={() => navigate(`/ui/entrances/${entrance.id}`)}
            loading={loading}
            disabled={!newCave || isSameCave}
          />
        </Box>
      ) : (
        <DetachEntranceSection entrance={entrance} />
      )}
    </Box>
  );
};

MoveEntranceToCaveForm.propTypes = {
  entrance: EntranceType.isRequired
};

export default MoveEntranceToCaveForm;
