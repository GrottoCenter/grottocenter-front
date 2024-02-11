import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import useMakeCustomCellRenders from './customCellRenders';
import useMakeCustomHeaderCellRenders from './customHeaderCellRenders';
import Table from '../Table';
import { createColumns, createDefaultHiddenColumns } from '../Table/TableHead';

const documentDefaultHiddenColumns = [
  // 'id',
  'importId',
  'importSource',
  'identifier',
  'identifierType',
  'dateReviewed',
  'dateValidation',
  'datePublication',
  'isDeleted',
  'redirectTo',
  'isValidated',
  'creator',
  'creatorComment',
  'authors',
  'authorsOrganization',
  'reviewer',
  'validator',
  'validatorComment',
  'editor',
  'library',
  'pages',
  'license',
  'option',
  'languages',
  'files',
  'massifs',
  'cave',
  'entrance',
  'parent',
  'authorizationDocument',
  'modifiedDocJson',
  'oldBBS'
];

const DocumentsTable = ({
  currentPage,
  documents,
  defaultHiddenColumns,
  loading,
  openDetailedView,
  order,
  orderBy,
  rowsCount,
  rowsPerPage,
  selected,
  updateOrder,
  updateOrderBy,
  updatePage,
  updateRowsPerPage,
  updateSelected
}) => {
  const { formatMessage } = useIntl();
  const customCell = useMakeCustomCellRenders();
  const customHeader = useMakeCustomHeaderCellRenders();
  const [hiddenColumns, setHiddenColumns] = useState(
    defaultHiddenColumns ?? documentDefaultHiddenColumns
  );
  const makeTranslation = id =>
    formatMessage({ id: `${id[0].toUpperCase()}${id.slice(1)}` });
  const [columns, setColumns] = useState(
    createColumns(documents, makeTranslation)
  );

  useEffect(() => {
    setColumns(createColumns(documents, makeTranslation));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  useEffect(() => {
    setHiddenColumns(
      createDefaultHiddenColumns(
        columns,
        defaultHiddenColumns ?? documentDefaultHiddenColumns
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  return (
    <Table
      columns={columns}
      currentPage={currentPage}
      customCellRenders={customCell}
      customHeaderCellRenders={customHeader}
      data={documents || []}
      hiddenColumns={hiddenColumns}
      loading={loading}
      openDetailedView={openDetailedView}
      order={order}
      orderBy={orderBy}
      rowsCount={rowsCount}
      rowsPerPage={rowsPerPage}
      selection={selected}
      title={formatMessage({ id: 'Documents' })}
      updateCurrentPage={updatePage}
      updateHiddenColumns={setHiddenColumns}
      updateOrder={updateOrder}
      updateOrderBy={updateOrderBy}
      updateRowsPerPage={updateRowsPerPage}
      updateSelection={updateSelected}
    />
  );
};

DocumentsTable.propTypes = {
  currentPage: PropTypes.number.isRequired,
  documents: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      title: PropTypes.string
    })
  ),
  defaultHiddenColumns: PropTypes.arrayOf(PropTypes.string),
  loading: PropTypes.bool.isRequired,
  openDetailedView: PropTypes.func.isRequired,
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
  updateRowsPerPage: PropTypes.func.isRequired,
  updateSelected: PropTypes.func.isRequired
};

export default DocumentsTable;
