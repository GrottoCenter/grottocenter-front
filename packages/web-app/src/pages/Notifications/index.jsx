import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { Box, Button, Tooltip } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import EntityTable from '../../components/common/EntityTable';
import AuthChecker from '../../components/appli/AuthChecker';
import { fetchNotifications } from '../../actions/Notifications/GetNotifications';
import { readNotification } from '../../actions/Notifications/ReadNotification';
import { readAllNotifications } from '../../actions/Notifications/ReadAllNotifications';
import { countUnreadNotifications } from '../../actions/Notifications/CountUnreadNotifications';
import { useNotification } from '../../hooks';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import makeNotifications from './transformers';

const NotificationsPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { onError } = useNotification();

  const {
    notifications: notificationsRaw,
    totalCount: totalCountRaw,
    isLoading
  } = useSelector(state => state.notifications);

  const { count: unreadCount } = useSelector(
    state => state.countUnreadNotifications
  );

  const { status: readAllStatus, error: readAllError } = useSelector(
    state => state.readAllNotifications
  );

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const prevReadAllStatus = useRef(readAllStatus);

  useEffect(() => {
    dispatch(fetchNotifications({ limit: 50, skip: 0 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (notificationsRaw) setNotifications(makeNotifications(notificationsRaw));
  }, [notificationsRaw]);

  useEffect(() => {
    if (totalCountRaw) setTotalCount(totalCountRaw);
  }, [totalCountRaw]);

  useEffect(() => {
    if (
      readAllStatus === REDUCER_STATUS.SUCCEEDED &&
      prevReadAllStatus.current !== REDUCER_STATUS.SUCCEEDED
    ) {
      dispatch(fetchNotifications({ limit: 50, skip: 0 }));
      dispatch(countUnreadNotifications());
    }
    prevReadAllStatus.current = readAllStatus;
  }, [dispatch, readAllStatus]);

  const prevReadAllError = useRef(readAllError);
  useEffect(() => {
    if (readAllError && readAllError !== prevReadAllError.current) {
      onError(
        formatMessage({
          id: 'An error occurred while marking all notifications as read'
        })
      );
    }
    prevReadAllError.current = readAllError;
  }, [readAllError, formatMessage, onError]);

  const isReadAllLoading = readAllStatus === REDUCER_STATUS.LOADING;
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
          onClick={() => dispatch(readAllNotifications())}>
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
                dispatch(readNotification(doc.id));
                return true;
              }}
              onPageChange={(pageNum, pageSize) => {
                dispatch(
                  fetchNotifications({
                    limit: pageSize,
                    skip: pageNum * pageSize
                  })
                );
              }}
            />
          }
        />
      }
    />
  );
};

export default NotificationsPage;
