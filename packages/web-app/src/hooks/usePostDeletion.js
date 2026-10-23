import { useNavigate } from 'react-router-dom';

import { getPostDeletionUrl } from '@/utils/deletedEntityRedirect';

export const usePostDeletion = ({ entityType }) => {
  const navigate = useNavigate();
  const onDeleted = (entityId, isPermanent = true) => {
    if (isPermanent) {
      navigate(getPostDeletionUrl(entityType, entityId), { replace: true });
    }
  };

  return { onDeleted };
};
