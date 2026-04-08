import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isMobile } from 'react-device-detect';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';

import {
  Box,
  Divider,
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
  TableContainer,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';

import DescriptionIcon from '@mui/icons-material/Description';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import SearchOffIcon from '@mui/icons-material/SearchOff';

import entitiesConfig from './entitiesConfig';
import { LoadingTableHead, LoadingTableBodyInner } from './LoadingTable';
import Translate from '../Translate';

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 100, 200];
const MAX_DOCUMENTS_TO_EXPORT_IN_CSV = 10000; // This limit is also enforced server side

// Maps display field -> API sort field for sortable columns, per entity type.
// Entity types with no sortable columns are excluded.
const SORT_FIELD_MAP = Object.fromEntries(
  Object.entries(entitiesConfig)
    .map(([type, config]) => [
      type,
      Object.fromEntries(
        config.columns
          .filter(col => col.sortable)
          .map(col => [col.field, col.apiField ?? col.field])
      )
    ])
    .filter(([, map]) => Object.keys(map).length > 0)
);

const applyColumnVisibility = (columns, storedVisibility) => {
  try {
    const visibleFields = JSON.parse(storedVisibility);
    return columns.map(col => ({ ...col, visible: visibleFields.includes(col.field) }));
  } catch (e) {
    return columns;
  }
};

export const getStoredRowsPerPage = (
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS
) => {
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
        .filter(e => e.visible)
        .map(headCell => (
          <TableCell
            key={headCell.field}
            sortDirection={orderBy === headCell.field ? order : false}>
            {onRequestSort && headCell.sortable ? (
              <TableSortLabel
                active={orderBy === headCell.field && order}
                direction={order || undefined}
                onClick={event => onRequestSort(event, headCell.field)}>
                <Translate>{headCell.label}</Translate>
              </TableSortLabel>
            ) : (
              <Translate>{headCell.label}</Translate>
            )}
          </TableCell>
        ))}
    </TableRow>
  </TableHead>
);
EntityTableHead.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({})),
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
      <Tooltip title={formatMessage({ id: 'Change columns' })}>
        <IconButton
          color="primary"
          onClick={event => setAnchorEl(event.currentTarget)}>
          <ViewColumnIcon />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}>
        <MenuItem key="label" disabled>
          {formatMessage({ id: 'Change columns' })}
        </MenuItem>
        {columns.map(column => (
          <MenuItem
            key={column.field}
            onClick={() => {
              const newColumns = columns.map(c =>
                c === column ? { ...c, visible: !c.visible } : c
              );
              setColumns(newColumns);
              if (entityType) {
                const storageKey = `entityTable_${entityType}_columns`;
                const visibleFields = newColumns
                  .filter(col => col.visible)
                  .map(col => col.field);
                localStorage.setItem(storageKey, JSON.stringify(visibleFields));
              }
            }}>
            <Checkbox
              size="small"
              checked={column.visible}
              onChange={() => {}}
              name={column.field}
            />
            <Translate>{column.label}</Translate>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
VisibleColumnsMenu.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setColumns: PropTypes.func.isRequired,
  entityType: PropTypes.string
};

const EmptyState = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: 1.5,
      color: 'text.disabled'
    }}>
    <SearchOffIcon sx={{ fontSize: 56 }} />
    <Typography variant="h6" color="text.secondary">
      <Translate>No results</Translate>
    </Typography>
    <Typography variant="body2" color="text.disabled">
      <Translate>Try adjusting your search or filters</Translate>
    </Typography>
  </Box>
);

const JumpToPage = ({ page, count, rowsPerPage, onPageChange }) => {
  const { formatMessage } = useIntl();
  const totalPages = Math.max(1, Math.ceil(count / rowsPerPage));
  const [inputValue, setInputValue] = useState(String(page + 1));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setInputValue(String(Math.min(page + 1, totalPages)));
    setPending(false);
  }, [page, totalPages]);

  const commit = value => {
    if (pending) return;
    const parsed = parseInt(value, 10);
    if (/^\d+$/.test(value) && parsed >= 1 && parsed <= totalPages) {
      setPending(true);
      onPageChange(null, parsed - 1);
    } else {
      setInputValue(String(page + 1));
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
      <Typography variant="body2" noWrap>
        <Translate>Go to page</Translate>
      </Typography>
      <TextField
        size="small"
        disabled={pending}
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit(e.target.value);
        }}
        slotProps={{
          htmlInput: {
            inputMode: 'numeric',
            pattern: '[0-9]*',
            style: { textAlign: 'center', padding: '2px 6px' },
            'aria-label': formatMessage({ id: 'Go to page' })
          }
        }}
        sx={{ width: 56, '& input': { fontSize: theme => theme.typography.body2.fontSize } }}
      />
      <Typography variant="body2">/ {totalPages}</Typography>
    </Box>
  );
};
JumpToPage.propTypes = {
  page: PropTypes.number.isRequired,
  count: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired
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
    const fieldMap = SORT_FIELD_MAP[entityType];
    if (!fieldMap || !(property in fieldMap)) {
      // eslint-disable-next-line no-console
      console.warn(
        `Sort blocked: field "${property}" is not allowed for entity type "${entityType}"`
      );
      return;
    }
    const apiField = fieldMap[property];

    if (orderBy === property) {
      let newOrder = 'asc';
      if (order === 'asc') newOrder = 'desc';
      else if (order === 'desc') newOrder = '';
      setOrder(newOrder);
      if (onSortChange) {
        if (newOrder) onSortChange(`${apiField}:${newOrder}`);
        else onSortChange('');
      }
    } else {
      setOrderBy(property);
      setOrder('asc');
      if (onSortChange) onSortChange(`${apiField}:asc`);
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

  const visibleColumns = entityColumns.filter(e => e.visible);
  const colSpan = visibleColumns.length + (onSelected ? 1 : 0);

  const TableContent =
    pageRows.length === 0 ? (
      <TableRow>
        <TableCell colSpan={colSpan} sx={{ border: 0, p: 0 }}>
          <EmptyState />
        </TableCell>
      </TableRow>
    ) : (
      pageRows.map(doc => {
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
            {visibleColumns.map(column => (
              <TableCell key={column.field}>
                {renderCell(doc, column.field, column.render)}
              </TableCell>
            ))}
          </TableRow>
        );
      })
    );

  return (
    <Box sx={{ width: '100%' }}>
      {!shouldHideFooter && (
        <>
          <Toolbar
            disableGutters
            variant="dense"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              minHeight: 48
            }}>
            {nbTotalRows != null && !isLoading && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mr: 'auto' }}>
                {formatMessage({ id: 'results_count' }, { count: nbTotalRows })}
              </Typography>
            )}
            <VisibleColumnsMenu
              columns={entityColumns}
              setColumns={setEntityColumns}
              entityType={entityType}
            />
            {onCSVDownload &&
              (nbTotalRows <= MAX_DOCUMENTS_TO_EXPORT_IN_CSV ? (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    const c = entityColumns.filter(e => e.visible);
                    onCSVDownload(
                      c.map(e => e.apiField || e.field),
                      c.map(e => e.label)
                    );
                  }}
                  startIcon={<DescriptionIcon />}>
                  {!isMobile && <Translate>Export to CSV</Translate>}
                </Button>
              ) : (
                <Tooltip
                  title={formatMessage({
                    id: 'Export unavailable above 10000 results'
                  })}>
                  <span>
                    <Button
                      variant="text"
                      size="small"
                      disabled
                      startIcon={<DescriptionIcon />}>
                      {!isMobile && <Translate>Export to CSV</Translate>}
                    </Button>
                  </span>
                </Tooltip>
              ))}
          </Toolbar>
          <Divider />
        </>
      )}
      {isLoading && <LinearProgress color="secondary" />}
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
      {!shouldHideFooter && onPageChange && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            flexWrap: 'wrap'
          }}>
          {!isMobile && (
            <JumpToPage
              page={page}
              count={nbTotalRows}
              rowsPerPage={rowsPerPage}
              onPageChange={handleChangePage}
            />
          )}
          <StyledTablePagination
            showFirstButton
            showLastButton
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
