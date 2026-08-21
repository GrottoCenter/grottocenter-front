import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Box, Button, Tooltip } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import EntityTable from '../../components/common/EntityTable';
import AuthChecker from '../../components/appli/AuthChecker';
import {
  useNotification,
  useNotifications,
  useReadAllNotifications,
  useReadNotification,
  useUnreadNotificationsCount
} from '../../hooks';
import makeNotifications from './transformers';

const NotificationsPage = () => {
  const { formatMessage } = useIntl();
  const { onError } = useNotification();
  const [pagination, setPagination] = useState({ limit: 50, skip: 0 });

  const { data: listData, isFetching: isLoading } =
    useNotifications(pagination);
  const notificationsRaw = listData?.notifications;
  const totalCountRaw = listData?.totalCount;

  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const readNotificationMutation = useReadNotification();
  const readAllMutation = useReadAllNotifications();

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (notificationsRaw) setNotifications(makeNotifications(notificationsRaw));
  }, [notificationsRaw]);

  useEffect(() => {
    if (totalCountRaw) setTotalCount(totalCountRaw);
  }, [totalCountRaw]);

  const prevReadAllError = useRef(readAllMutation.error);
  useEffect(() => {
    const err = readAllMutation.error;
    if (err && err !== prevReadAllError.current) {
      onError(
        formatMessage({
          id: 'An error occurred while marking all notifications as read'
        })
      );
    }
    prevReadAllError.current = err;
  }, [readAllMutation.error, formatMessage, onError]);

  const isReadAllLoading = readAllMutation.isPending;
  const hasUnread = unreadCount > 0;

  const markAllButton = (
    <Tooltip
      title={hasUnread ? '' : formatMessage({ id: 'No unread notifications' })}>
      <span>
        <Button
          color="secondary"
          variant="outlined"
          startIcon={<DoneAllIcon />}
          disabled={!hasUnread || isReadAllLoading}
          onClick={() => readAllMutation.mutate()}>
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            {formatMessage({ id: 'Mark all as read' })}
          </Box>
        </Button>
      </span>
    </Tooltip>
  );

  return (
    <Layout
      title={formatMessage({ id: 'My notifications' })}
      action={markAllButton}
      content={
        <AuthChecker
          componentToDisplay={
            <EntityTable
              entityType="notifications"
              pageSizeOptions={[50, 100]}
              isLoading={isLoading}
              pageRows={notifications}
              nbTotalRows={totalCount}
              onRowClick={doc => {
                if (doc.isRead) return true;
                readNotificationMutation.mutate(doc.id);
                return true;
              }}
              onPageChange={(pageNum, pageSize) => {
                setPagination({
                  limit: pageSize,
                  skip: pageNum * pageSize
                });
              }}
            />
          }
        />
      }
    />
  );
};

export default NotificationsPage;
