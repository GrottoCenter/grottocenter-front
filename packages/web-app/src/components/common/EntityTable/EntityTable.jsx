import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import {
  Box,
  IconButton,
  Button,
  Checkbox,
  LinearProgress,
  Menu,
  MenuItem,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  TableSortLabel,
  TablePagination,
  TableContainer
} from '@mui/material';

import DescriptionIcon from '@mui/icons-material/Description';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';

import entitiesConfig from './entitiesConfig';
import { LoadingTableHead, LoadingTableBodyInner } from './LoadingTable';
import Alert from '../Alert';
import Translate from '../Translate';

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 100, 200];
const MAX_DOCUMENTS_TO_EXPORT_IN_CSV = 10000; // This limit is also enforced server side

const applyColumnVisibility = (columns, storedVisibility) => {
  try {
    const visibleColumns = JSON.parse(storedVisibility);
    return columns.map(col => {
      const newCol = [...col];
      newCol[0] = visibleColumns.includes(col[1]);
      return newCol;
    });
  } catch (e) {
    return columns;
  }
};

export const getStoredRowsPerPage = (pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS) => {
  const stored = localStorage.getItem('entityTable_rowsPerPage');
  if (stored) {
    const value = parseInt(stored, 10);
    if (pageSizeOptions.includes(value)) return value;
  }
  return pageSizeOptions[0];
};

const StyledTablePagination = styled(TablePagination)`
  p {
    margin: inherit !important;
  }
`;

const getObjectPath = (obj, path) => {
  const pathParts = path.split('.');
  let out = obj;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < pathParts.length; i++) {
    if (!out || typeof out !== 'object' || !(pathParts[i] in out)) return null; // Safe early return
    out = out[pathParts[i]];
  }
  return out;
};

const EntityTableHead = ({
  columns,
  order,
  orderBy,
  onRequestSort,
  numSelected,
  rowCount,
  onSelectAllClick
}) => (
  <TableHead>
    <TableRow>
      {onSelectAllClick && (
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>
      )}
      {columns
        .filter(e => e[0])
        .map(headCell => (
          <TableCell
            key={headCell[1]}
            sortDirection={orderBy === headCell[1] ? order : false}>
            {onRequestSort && headCell[3] ? (
              <TableSortLabel
                active={orderBy === headCell[1] && order}
                hideSortIcon
                direction={order || undefined}
                onClick={event => onRequestSort(event, headCell[1])}>
                <Translate>{headCell[2]}</Translate>
              </TableSortLabel>
            ) : (
              <Translate>{headCell[2]}</Translate>
            )}
          </TableCell>
        ))}
    </TableRow>
  </TableHead>
);
EntityTableHead.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.array),
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func.isRequired,
  onSelectAllClick: PropTypes.func,
  order: PropTypes.oneOf(['', 'asc', 'desc']).isRequired,
  orderBy: PropTypes.string.isRequired,
  rowCount: PropTypes.number.isRequired
};

const VisibleColumnsMenu = ({ columns, setColumns, entityType }) => {
  const { formatMessage } = useIntl();
  const [anchorEl, setAnchorEl] = useState(null);
  return (
    <>
      <IconButton
        color="primary"
        onClick={event => setAnchorEl(event.currentTarget)}
        sx={{ marginRight: '1em' }}>
        <ViewColumnIcon />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}>
        <MenuItem key="label" disabled>
          {formatMessage({ id: 'Change columns' })}
        </MenuItem>
        {columns.map(column => (
          <MenuItem
            key={column[1]}
            onClick={() => {
              column[0] = !column[0]; // eslint-disable-line no-param-reassign
              const newColumns = [...columns];
              setColumns(newColumns);
              if (entityType) {
                const storageKey = `entityTable_${entityType}_columns`;
                const visibleColumns = newColumns.filter(col => col[0]).map(col => col[1]);
                localStorage.setItem(storageKey, JSON.stringify(visibleColumns));
              }
            }}>
            <Checkbox
              size="small"
              checked={column[0]}
              onChange={() => {}}
              name={column[1]}
            />
            <Translate>{column[2]}</Translate>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
VisibleColumnsMenu.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.array).isRequired,
  setColumns: PropTypes.func.isRequired,
  entityType: PropTypes.string
};

const EntityTable = ({
  entityType,
  entityColumnsModifier,
  isLoading = true,
  onSelected,
  pageRows,
  nbTotalRows,
  onRowClick,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageChange,
  onSortChange,
  onCSVDownload,
  isNewQuery = false,
  shouldHideFooter = false
}) => {
  const { formatMessage } = useIntl();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getStoredRowsPerPage(pageSizeOptions)
  );
  const [order, setOrder] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [selected, setSelected] = useState([]);
  const entityConfig = entitiesConfig[entityType ?? 'placeholder'];
  const [entityColumns, setEntityColumns] = useState(() => {
    const storageKey = `entityTable_${entityType}_columns`;
    const stored = localStorage.getItem(storageKey);
    return stored
      ? applyColumnVisibility(entityConfig.columns, stored)
      : entityConfig.columns;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    if (onPageChange) onPageChange(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = event => {
    const nbRowPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(nbRowPerPage);
    localStorage.setItem('entityTable_rowsPerPage', nbRowPerPage);
    setPage(0);
    if (onPageChange) onPageChange(0, nbRowPerPage);
  };

  useEffect(() => {
    if (onPageChange && rowsPerPage !== pageSizeOptions[0]) {
      onPageChange(0, rowsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRowClick = (event, doc) => {
    if (onSelected) {
      handleRowSelect(event, doc);
      return;
    }
    if (onRowClick) {
      const shouldContinue = onRowClick(doc);
      if (!shouldContinue) return;
    }

    const url = entityConfig.link(doc);
    if (!url) return;
    // Better UX on mobile
    if (isMobile) navigate(url);
    else window.open(url, '_blank');
  };

  const handleRowSelect = (event, doc) => {
    event.stopPropagation();
    const newSelected = [...selected];

    const selectedIndex = selected.indexOf(doc.id);
    if (selectedIndex === -1) {
      newSelected.push(doc.id);
    } else {
      newSelected.splice(selectedIndex, 1);
    }
    setSelected(newSelected);
    onSelected(newSelected);
  };

  const handleRequestSort = (event, property) => {
    if (orderBy === property) {
      let newOrder = 'asc';
      if (order === 'asc') newOrder = 'desc';
      else if (order === 'desc') newOrder = '';
      setOrder(newOrder);
      if (onSortChange) {
        if (newOrder) onSortChange(`${orderBy}:${newOrder}`);
        else onSortChange(``);
      }
    } else {
      setOrderBy(property);
      setOrder('asc');
      if (onSortChange) onSortChange(`${property}:asc`);
    }
  };

  const handleSelectAllClick = event => {
    let newSelected = [];
    if (event.target.checked) {
      newSelected = pageRows.map(n => n.id);
    }
    setSelected(newSelected);
    onSelected(newSelected);
  };

  const renderCell = (doc, key, renderFn) => {
    const v = getObjectPath(doc, key);
    if (renderFn) return renderFn(v, doc);
    if (v === true) return <CheckIcon sx={{ color: 'green' }} />;
    if (v === false) return <CloseIcon sx={{ color: 'red' }} />;
    if (v) return v;
    return '-';
  };

  useEffect(() => {
    const storageKey = `entityTable_${entityType}_columns`;
    const stored = localStorage.getItem(storageKey);
    let column = stored
      ? applyColumnVisibility(entityConfig.columns, stored)
      : entityConfig.columns;
    
    if (entityColumnsModifier) entityColumnsModifier(column);
    setEntityColumns(column);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType]);

  useEffect(() => {
    if (!isNewQuery) return;
    setPage(0);
    setOrder('');
    setOrderBy('');
    setSelected([]);
  }, [isNewQuery]);

  if (!pageRows) return null;

  let TableContent;
  if (pageRows.length === 0) {
    TableContent = (
      <TableRow>
        <TableCell colSpan={entityColumns.filter(e => e[0]).length + (onSelected ? 1 : 0)}>
          <Alert severity="info" title={formatMessage({ id: 'No results' })} />
        </TableCell>
      </TableRow>
    );
  } else {
    TableContent = pageRows.map(doc => {
      const isItemSelected = selected.includes(doc.id);

      return (
        <TableRow
          hover
          onClick={event => handleRowClick(event, doc)}
          role="checkbox"
          tabIndex={-1}
          key={doc.id}
          selected={isItemSelected}
          sx={{ cursor: 'pointer' }}>
          {onSelected && (
            <TableCell padding="checkbox">
              <Checkbox
                color="primary"
                checked={isItemSelected}
                onClick={event => handleRowSelect(event, doc)}
              />
            </TableCell>
          )}

          {entityColumns
            .filter(e => e[0])
            .map(column => (
              <TableCell key={column[1]}>
                {renderCell(doc, column[1], column[4])}
              </TableCell>
            ))}
        </TableRow>
      );
    });
  }

  return (
    <Box sx={{ width: '100%' }}>
      <TableContainer>
        <Table stickyHeader sx={{ minWidth: 750 }} size="small">
          {isLoading ? (
            <LoadingTableHead />
          ) : (
            <EntityTableHead
              columns={entityColumns}
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={onSelected ? handleSelectAllClick : null}
              onRequestSort={onSortChange ? handleRequestSort : null}
              rowCount={pageRows.length}
            />
          )}
          <TableBody>
            {isLoading ? <LoadingTableBodyInner /> : TableContent}
          </TableBody>
        </Table>
      </TableContainer>
      {isLoading && <LinearProgress color="secondary" />}
      {!shouldHideFooter && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
          <div>
            <VisibleColumnsMenu
              columns={entityColumns}
              setColumns={setEntityColumns}
              entityType={entityType}
            />
            {onCSVDownload && nbTotalRows <= MAX_DOCUMENTS_TO_EXPORT_IN_CSV && (
              <Button
                variant="text"
                onClick={() => {
                  const c = entityColumns.filter(e => e[0]);
                  onCSVDownload(
                    c.map(e => e[1]),
                    c.map(e => e[2])
                  );
                }}
                startIcon={<DescriptionIcon />}>
                <Translate>Export to CSV</Translate>
              </Button>
            )}
          </div>
          {onPageChange && (
            <StyledTablePagination
              rowsPerPageOptions={pageSizeOptions}
              component="div"
              count={nbTotalRows}
              rowsPerPage={rowsPerPage}
              page={page}
              labelRowsPerPage={formatMessage({
                id: isMobile ? 'Per page:' : 'Results per page:'
              })}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

EntityTable.propTypes = {
  entityType: PropTypes.string,
  entityColumnsModifier: PropTypes.func,
  isLoading: PropTypes.bool,
  onSelected: PropTypes.func,
  pageRows: PropTypes.arrayOf(PropTypes.shape({})),
  nbTotalRows: PropTypes.number,
  onRowClick: PropTypes.func,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
  onPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onCSVDownload: PropTypes.func,
  isNewQuery: PropTypes.bool,
  shouldHideFooter: PropTypes.bool
};

export default EntityTable;
