import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Link } from '@mui/material';
import { useNotification } from './useNotification';

export const useMoveRelevanceWithUndo = moveThunk => {
  const dispatch = useDispatch();
  const { onError, onSuccess, onClose } = useNotification();
  const { formatMessage } = useIntl();
  const [movingId, setMovingId] = useState(null);

  const handleMove = useCallback(
    (entityId, direction) => {
      setMovingId(entityId);
      dispatch(moveThunk(entityId, direction))
        .then(result => {
          if (result?.error) {
            onError(
              typeof result.error === 'string'
                ? result.error
                : formatMessage({ id: 'genericError' }),
              { autoHideDuration: 6000 }
            );
            return;
          }
          onSuccess(formatMessage({ id: 'Order updated' }), {
            autoHideDuration: 6000,
            action: snackbarId => (
              <Link
                component="button"
                color="inherit"
                underline="always"
                sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
                onClick={() => {
                  onClose(snackbarId);
                  setMovingId(entityId);
                  dispatch(moveThunk(entityId, direction * -1))
                    .then(undoResult => {
                      if (undoResult?.error) {
                        onError(formatMessage({ id: 'genericError' }), {
                          autoHideDuration: 6000
                        });
                        return;
                      }
                      onSuccess(formatMessage({ id: 'Undo successful' }), {
                        autoHideDuration: 3000
                      });
                    })
                    .finally(() => setMovingId(null));
                }}>
                {formatMessage({ id: 'Undo' })}
              </Link>
            )
          });
        })
        .finally(() => setMovingId(null));
    },
    [dispatch, moveThunk, onError, onSuccess, onClose, formatMessage]
  );

  return { movingId, handleMove };
};
