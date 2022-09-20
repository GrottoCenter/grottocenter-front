import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';

import Layout from '../../components/common/Layouts/Fixed/FixedContent';
import AuthChecker from '../../components/appli/AuthChecker';
import REDUCER_STATUS from '../../reducers/ReducerStatus';
import NotificationsTable from '../../components/common/NotificationsTable';
import { fetchNotifications } from '../../actions/Notifications/GetNotifications';
import makeNotifications from './transformers';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(2)}px;
`;

const defaultHiddenColumns = ['id', 'link'];

const NotificationsPage = () => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const { notifications, status, totalCount } = useSelector(
    state => state.notifications
  );

  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);

  const [order, setOrder] = React.useState('desc');
  const [orderBy, setOrderBy] = React.useState('dateInscription');
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const loadNotifications = useCallback(() => {
    const criterias = {
      limit: rowsPerPage,
      skip: page * rowsPerPage,
      sortBy: orderBy,
      orderBy: order
    };
    dispatch(fetchNotifications(criterias));
  }, [dispatch, order, orderBy, page, rowsPerPage]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <Layout
      title={formatMessage({ id: 'My notifications' })}
      content={
        <AuthChecker
          componentToDisplay={
            <Wrapper>
              <NotificationsTable
                currentPage={page}
                notifications={makeNotifications(notifications)}
                defaultHiddenColumns={defaultHiddenColumns}
                loading={status === REDUCER_STATUS.LOADING}
                order={order}
                orderBy={orderBy || undefined}
                rowsCount={totalCount || 0}
                rowsPerPage={rowsPerPage}
                selected={selected}
                updateOrder={setOrder}
                updateOrderBy={setOrderBy}
                updatePage={setPage}
                updateRowsPerPage={setRowsPerPage}
                updateSelected={setSelected}
              />
            </Wrapper>
          }
        />
      }
    />
  );
};

export default NotificationsPage;
