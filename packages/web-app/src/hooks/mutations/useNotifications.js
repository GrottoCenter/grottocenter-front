import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  readNotificationUrl,
  readAllNotificationsUrl
} from '../../conf/apiRoutes';
import { apiPost, apiPut } from '../../api/client';
import { notificationKeys } from '../../api/queryKeys';

// Both mutations invalidate the whole notification domain (list + menu +
// unreadCount). Only queries currently mounted refetch, so the cost is at
// most one page + the badge, and the UI stays consistent without hand-
// written optimistic updates.
const invalidateNotifications = queryClient =>
  queryClient.invalidateQueries({ queryKey: notificationKeys.all });

export const useReadNotification = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationId => apiPost(readNotificationUrl(notificationId)),
    onSuccess: () => invalidateNotifications(queryClient)
  });
};

export const useReadAllNotifications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPut(readAllNotificationsUrl),
    onSuccess: () => invalidateNotifications(queryClient)
  });
};
