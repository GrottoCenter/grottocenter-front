import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import useMakeCustomCellRenders from './customCellRenders';
import useMakeCustomHeaderCellRenders from './customHeaderCellRenders';
import Table from '../Table';
import { createColumns, createDefaultHiddenColumns } from '../Table/TableHead';
import notificationype from '../../../types/notification.type';
import { readNotification } from '../../../actions/Notifications/ReadNotification';

const NotificationsTable = ({
  currentPage,
  notifications,
  defaultHiddenColumns,
  loading,
  order,
  orderBy,
  rowsCount,
  rowsPerPage,
  selected,
  updateOrder,
  updateOrderBy,
  updatePage,
  updateRowsPerPage
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const customCell = useMakeCustomCellRenders();
  const customHeader = useMakeCustomHeaderCellRenders();
  const [hiddenColumns, setHiddenColumns] = useState(defaultHiddenColumns);
  const history = useHistory();
  const makeTranslation = useCallback(
    id => formatMessage({ id: `${id[0].toUpperCase()}${id.slice(1)}` }),
    [formatMessage]
  );
  const [columns, setColumns] = useState(
    createColumns(notifications, makeTranslation)
  );

  useEffect(() => {
    setColumns(createColumns(notifications, makeTranslation));
  }, [notifications, makeTranslation]);

  useEffect(() => {
    setHiddenColumns(createDefaultHiddenColumns(columns, defaultHiddenColumns));
  }, [columns, defaultHiddenColumns]);

  const handleRowClick = row => {
    if (!row.isRead) {
      dispatch(readNotification(row.id));
    }
    history.push(row.link);
  };

  return (
    <Table
      columns={columns}
      currentPage={currentPage}
      customCellRenders={customCell}
      customHeaderCellRenders={customHeader}
      data={notifications || []}
      hiddenColumns={hiddenColumns}
      loading={loading}
      onRowClick={handleRowClick}
      order={order}
      orderBy={orderBy}
      rowsCount={rowsCount}
      rowsPerPage={rowsPerPage}
      selection={selected}
      title={formatMessage({ id: 'Notifications' })}
      updateCurrentPage={updatePage}
      updateHiddenColumns={setHiddenColumns}
      updateOrder={updateOrder}
      updateOrderBy={updateOrderBy}
      updateRowsPerPage={updateRowsPerPage}
    />
  );
};

NotificationsTable.propTypes = {
  currentPage: PropTypes.number.isRequired,
  notifications: PropTypes.arrayOf(notificationype),
  defaultHiddenColumns: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool.isRequired,
  order: PropTypes.oneOf(['asc', 'desc']).isRequired,
  orderBy: PropTypes.string,
  rowsCount: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  selected: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.number.isRequired,
      PropTypes.string.isRequired
    ])
  ).isRequired,
  updateOrder: PropTypes.func.isRequired,
  updateOrderBy: PropTypes.func.isRequired,
  updatePage: PropTypes.func.isRequired,
  updateRowsPerPage: PropTypes.func.isRequired
};

export default NotificationsTable;
