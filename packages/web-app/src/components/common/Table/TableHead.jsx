import { TableHead as MuiTableHead, TableRow } from '@material-ui/core';
import React from 'react';
import PropTypes from 'prop-types';

import { InitialHead } from './InitialTable';
import CustomHeaderCell from './CustomHeaderCell';

export const createColumns = (rawData, makeTranslation) =>
  Object.keys(rawData[0] ?? {}).map(key => ({
    label: makeTranslation(key),
    id: key
  }));

export const createDefaultHiddenColumns = (columns, defaults) => [
  ...columns.map(e => e.id).filter(id => id[0] === '@'),
  ...defaults
];

const TableHead = ({
  visibleColumns,
  isInitializing,
  customHeaderCellRenders,
  ...orderProps
}) => (
  <MuiTableHead>
    <TableRow>
      {isInitializing ? (
        <InitialHead />
      ) : (
        visibleColumns.map(({ id, label }) => (
          <CustomHeaderCell
            key={id}
            value={label}
            id={id}
            customRenders={
              !customHeaderCellRenders ? customHeaderCellRenders : undefined
            }
            {...orderProps}
          />
        ))
      )}
    </TableRow>
  </MuiTableHead>
);

TableHead.propTypes = {
  visibleColumns: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      id: PropTypes.oneOfType([
        PropTypes.string.isRequired,
        PropTypes.number.isRequired
      ])
    })
  ).isRequired,
  onSort: PropTypes.func,
  orderBy: PropTypes.string,
  order: PropTypes.oneOf(['asc', 'desc']),
  isInitializing: PropTypes.bool,
  customHeaderCellRenders: PropTypes.func
};

export default TableHead;
