import { useState, useCallback } from 'react';
import { useIntl } from 'react-intl';
import { Link } from '@mui/material';
import { useNotification } from './useNotification';

/**
 * Drives a move-relevance mutation with an inline "Undo" affordance.
 *
 * Takes the mutation returned by `useMoveXxxRelevance()` — its `mutateAsync`
 * is what this hook chains. The pattern accommodates a follow-up dispatch
 * (the undo) that must know when the initial move actually landed, hence
 * awaiting `mutateAsync` rather than using `mutate`.
 *
 * @param {ReturnType<typeof useMutation>} mutation - result of e.g. useMoveDescriptionRelevance()
 */
export const useMoveRelevanceWithUndo = mutation => {
  const { onError, onSuccess, onClose } = useNotification();
  const { formatMessage } = useIntl();
  const [movingId, setMovingId] = useState(null);
  const { mutateAsync } = mutation;

  const handleMove = useCallback(
    (entityId, direction) => {
      setMovingId(entityId);
      mutateAsync({ id: entityId, direction })
        .then(() => {
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
                  mutateAsync({ id: entityId, direction: direction * -1 })
                    .then(() => {
                      onSuccess(formatMessage({ id: 'Undo successful' }), {
                        autoHideDuration: 3000
                      });
                    })
                    .catch(() => {
                      onError(formatMessage({ id: 'genericError' }), {
                        autoHideDuration: 6000
                      });
                    })
                    .finally(() => setMovingId(null));
                }}>
                {formatMessage({ id: 'Undo' })}
              </Link>
            )
          });
        })
        .catch(error => {
          onError(
            typeof error?.message === 'string'
              ? error.message
              : formatMessage({ id: 'genericError' }),
            { autoHideDuration: 6000 }
          );
        })
        .finally(() => setMovingId(null));
    },
    [mutateAsync, onError, onSuccess, onClose, formatMessage]
  );

  return { movingId, handleMove };
};
