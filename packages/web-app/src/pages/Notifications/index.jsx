import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import EntityTable from '../../components/common/EntityTable';
import AuthChecker from '../../components/appli/AuthChecker';
import { fetchNotifications } from '../../actions/Notifications/GetNotifications';
import { readNotification } from '../../actions/Notifications/ReadNotification';
import makeNotifications from './transformers';

const NotificationsPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const {
    notifications: notificationsRaw,
    totalCount: totalCountRaw,
    isLoading
  } = useSelector(state => state.notifications);

  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

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

  return (
    <Layout
      title={formatMessage({ id: 'My notifications' })}
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
