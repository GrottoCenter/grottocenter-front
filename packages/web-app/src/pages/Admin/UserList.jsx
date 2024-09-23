import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import Table from '../../components/common/Table';
import {
  createColumns,
  createDefaultHiddenColumns
} from '../../components/common/Table/TableHead';

const MarginBottomBlock = styled('div')`
  margin-bottom: ${({ theme }) => theme.spacing(4)};
`;

const customCellRenders = [
  {
    id: 'groups',
    customRender: groups => groups.map(e => e.name ?? '').join(',')
  }
];

const defaultHiddenColumns = ['groups'];

/**
 * In this component, the custom GC Table is used without multiple pages
 * and it's offline.
 * It assumes that all users are already loaded and they will not be updated.
 */
const UserList = ({ isLoading, title, userList }) => {
  const { formatMessage } = useIntl();
  const makeTranslation = id => {
    if (id === 'name') return formatMessage({ id: 'Caver.Name' });
    return formatMessage({ id: `${id[0].toUpperCase()}${id.slice(1)}` });
  };
  const [columns, setColumns] = useState(
    createColumns(userList, makeTranslation)
  );
  const [hiddenColumns, setHiddenColumns] = useState(defaultHiddenColumns);

  useEffect(() => {
    setColumns(createColumns(userList, makeTranslation));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userList]);

  useEffect(() => {
    setHiddenColumns(createDefaultHiddenColumns(columns, defaultHiddenColumns));
  }, [columns]);

  return (
    <MarginBottomBlock>
      <Table
        columns={columns}
        customCellRenders={customCellRenders}
        data={userList || []}
        hiddenColumns={hiddenColumns}
        loading={isLoading}
        rowsCount={userList.length}
        rowsPerPage={userList.length}
        title={title}
        updateHiddenColumns={setHiddenColumns}
      />
    </MarginBottomBlock>
  );
};

UserList.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  userList: PropTypes.arrayOf(PropTypes.shape({})).isRequired
};
export default UserList;
