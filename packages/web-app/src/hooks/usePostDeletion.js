import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getPostDeletionUrl } from '@/utils/deletedEntityRedirect';

export const usePostDeletion = ({ entityType, id, entity, deleteMutation }) => {
  const navigate = useNavigate();
  const [wantedDeletedState, setWantedDeletedState] = useState(
    entity?.isDeleted ?? false
  );

  useEffect(() => {
    setWantedDeletedState(entity?.isDeleted ?? false);
  }, [id, entity?.isDeleted]);

  const onDeletePress = (entityId, isPermanent = true) => {
    setWantedDeletedState(true);
    deleteMutation.mutate(
      { id, entityId, isPermanent },
      {
        onSuccess: () => {
          if (isPermanent) {
            navigate(
              getPostDeletionUrl(entityType, entityId, entity?.redirectTo),
              { replace: true }
            );
          }
        },
        onError: () => setWantedDeletedState(entity?.isDeleted ?? false)
      }
    );
  };

  return { onDeletePress, wantedDeletedState, setWantedDeletedState };
};
