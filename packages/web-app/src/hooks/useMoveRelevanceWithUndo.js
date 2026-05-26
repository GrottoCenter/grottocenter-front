import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useSnackbar } from 'notistack';
import { useIntl } from 'react-intl';
import { Link } from '@mui/material';

export const useMoveRelevanceWithUndo = moveThunk => {
  const dispatch = useDispatch();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { formatMessage } = useIntl();
  const [movingId, setMovingId] = useState(null);

  const handleMove = useCallback(
    (entityId, direction) => {
      setMovingId(entityId);
      dispatch(moveThunk(entityId, direction))
        .then(result => {
          if (result?.error) {
            if (typeof result.error === 'string') {
              enqueueSnackbar(result.error, {
                variant: 'error',
                autoHideDuration: 6000
              });
            }
            return;
          }
          enqueueSnackbar(formatMessage({ id: 'Order updated' }), {
            variant: 'success',
            autoHideDuration: 6000,
            action: snackbarId => (
              <Link
                component="button"
                color="inherit"
                underline="always"
                sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
                onClick={() => {
                  closeSnackbar(snackbarId);
                  setMovingId(entityId);
                  dispatch(moveThunk(entityId, direction * -1))
                    .then(undoResult => {
                      if (undoResult?.error) return;
                      enqueueSnackbar(
                        formatMessage({ id: 'Undo successful' }),
                        { variant: 'success', autoHideDuration: 3000 }
                      );
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
    [dispatch, moveThunk, enqueueSnackbar, closeSnackbar, formatMessage]
  );

  return { movingId, handleMove };
};
