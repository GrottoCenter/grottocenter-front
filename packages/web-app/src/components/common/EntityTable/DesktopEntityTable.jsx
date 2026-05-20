import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { styled } from '@mui/material/styles';

import {
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewListIcon from '@mui/icons-material/ViewList';

import entitiesConfig from './entitiesConfig';
import { LoadingTableHead, LoadingTableBodyInner } from './LoadingTable';
import VisibleColumnsMenu from './VisibleColumnsMenu';
import { SORT_FIELD_MAP, getStoredRowsPerPage, renderCell } from './tableUtils';
import Translate from '../Translate';

const MAX_DOCUMENTS_TO_EXPORT_IN_CSV = 10000;

const StyledTablePagination = styled(TablePagination)`
  p {
    margin: inherit !important;
  }
`;

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

const EmptyState = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 8,
      gap: '12px',
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
        sx={{
          width: 56,
          '& input': { fontSize: theme => theme.typography.body2.fontSize }
        }}
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

const DesktopEntityTable = ({
  entityType,
  entityColumns,
  setEntityColumns,
  isLoading,
  onSelected,
  pageRows,
  nbTotalRows,
  onRowClick,
  pageSizeOptions,
  onPageChange,
  onSortChange,
  onCSVDownload,
  isNewQuery,
  shouldHideFooter,
  compact,
  onViewToggle,
  viewMode
}) => {
  const { formatMessage } = useIntl();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getStoredRowsPerPage(pageSizeOptions)
  );
  const [order, setOrder] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [selected, setSelected] = useState([]);

  const entityConfig = entitiesConfig[entityType ?? 'placeholder'];

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
    window.open(url, '_blank');
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

  useEffect(() => {
    if (!isNewQuery) return;
    setPage(0);
    setOrder('');
    setOrderBy('');
    setSelected([]);
  }, [isNewQuery]);

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
              <Typography variant="body2" color="text.secondary">
                {formatMessage({ id: 'results_count' }, { count: nbTotalRows })}
              </Typography>
            )}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              {onCSVDownload &&
                (nbTotalRows <= MAX_DOCUMENTS_TO_EXPORT_IN_CSV ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      const c = entityColumns.filter(e => e.visible);
                      onCSVDownload(
                        c.map(e => e.apiField || e.field),
                        c.map(e => e.label)
                      );
                    }}
                    startIcon={<FileDownloadIcon />}>
                    <Translate>Export to CSV</Translate>
                  </Button>
                ) : (
                  <Tooltip
                    title={formatMessage({
                      id: 'Export unavailable above 10000 results'
                    })}>
                    <span>
                      <Button
                        variant="outlined"
                        size="small"
                        disabled
                        startIcon={<FileDownloadIcon />}>
                        <Translate>Export to CSV</Translate>
                      </Button>
                    </span>
                  </Tooltip>
                ))}
              {!compact && (
                <VisibleColumnsMenu
                  columns={entityColumns}
                  setColumns={setEntityColumns}
                  entityType={entityType}
                  label="Change columns"
                  menuTitle="Change columns"
                  icon={ViewColumnIcon}
                />
              )}
              <Tooltip title={formatMessage({ id: viewMode === 'table' ? 'Card view' : 'Table view' })}>
                <IconButton
                  size="small"
                  onClick={onViewToggle}
                  color="primary"
                  sx={{
                    border: '1px solid',
                    borderColor: 'primary.main',
                    borderRadius: 1
                  }}>
                  <ViewListIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Toolbar>
          <Divider />
        </>
      )}
      {isLoading && <LinearProgress color="secondary" />}
      <TableContainer
        sx={compact ? { overflowX: 'auto', maxWidth: '100%' } : undefined}>
        <Table stickyHeader sx={{ minWidth: compact ? 300 : 750 }} size="small">
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
          <JumpToPage
            page={page}
            count={nbTotalRows}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
          />
          <StyledTablePagination
            showFirstButton
            showLastButton
            rowsPerPageOptions={pageSizeOptions}
            component="div"
            count={nbTotalRows}
            rowsPerPage={rowsPerPage}
            labelRowsPerPage={formatMessage({ id: 'Results per page:' })}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      )}
    </Box>
  );
};

DesktopEntityTable.propTypes = {
  entityType: PropTypes.string,
  entityColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setEntityColumns: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onSelected: PropTypes.func,
  pageRows: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  nbTotalRows: PropTypes.number,
  onRowClick: PropTypes.func,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  onPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onCSVDownload: PropTypes.func,
  isNewQuery: PropTypes.bool,
  shouldHideFooter: PropTypes.bool,
  compact: PropTypes.bool,
  onViewToggle: PropTypes.func,
  viewMode: PropTypes.string
};

export default DesktopEntityTable;
