import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import {
  Box,
  Checkbox,
  Divider,
  LinearProgress,
  MenuItem,
  Select,
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
  Typography,
  tablePaginationClasses
} from '@mui/material';

import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import ViewListIcon from '@mui/icons-material/ViewList';
import { useMeasuredHeight } from '../../../hooks';
import useOpenLink from '../../../hooks/useOpenLink';

import entitiesConfig from './entitiesConfig';
import ExportFormatDropdown from './ExportFormatDropdown';
import { LoadingTableHead, LoadingTableBodyInner } from './LoadingTable';
import ToolbarActionButton from './ToolbarActionButton';
import VisibleColumnsMenu from './VisibleColumnsMenu';
import {
  SORT_FIELD_MAP,
  TOOLBAR_ACTION_HEIGHT,
  getStoredRowsPerPage,
  renderCell
} from './tableUtils';
import Translate from '../Translate';

const MAX_DOCUMENTS_TO_EXPORT_IN_CSV = 10000;

// Stock TablePagination is dimensioned as a standalone table footer: a 52px
// toolbar, a 16px gutter, a spacer set to `flex: 1 1 100%` and a 20px margin
// before the arrows. Riding inside the 48px results toolbar instead, all of
// that turns into dead space between "1 / 722" and the arrows.
//
// The row range it also renders ("1–200 of 144374") says nothing the results
// count and that same "1 / 722" do not already say, right next to it. MUI emits
// its <p> unconditionally, and even empty it would still earn a slot in the
// toolbar's flex `gap`.
const INLINE_PAGINATION_SX = {
  [`& .${tablePaginationClasses.toolbar}`]: { minHeight: 0, pl: 0 },
  [`& .${tablePaginationClasses.spacer}`]: { display: 'none' },
  [`& .${tablePaginationClasses.displayedRows}`]: { display: 'none' },
  [`& .${tablePaginationClasses.toolbar} .${tablePaginationClasses.actions}`]: {
    ml: 0
  }
};

// MUI ships this as `visuallyHidden`, but only from @mui/utils, which is a
// transitive dependency here — inlined rather than promoting a whole package to
// a direct one for a single style object.
const VISUALLY_HIDDEN = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: '1px',
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px'
};

// Nearest ancestor that actually scrolls vertically. The table sits in one on
// every current page (FixedContent's CardContent), but which element that is
// belongs to the layout, not here — so it is found rather than assumed.
const getScrollParent = node => {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const { overflowY } = window.getComputedStyle(el);
    if (overflowY === 'auto' || overflowY === 'scroll') return el;
  }
  return null;
};

// MUI's default aria-labels are hardcoded English (`Go to ${type} page`), which
// is the only text in this bar that would not go through react-intl.
const PAGE_BUTTON_LABEL = {
  first: 'First page',
  previous: 'Previous page',
  next: 'Next page',
  last: 'Last page'
};

const EntityTableHead = ({
  columns,
  order,
  orderBy,
  onRequestSort,
  numSelected,
  rowCount,
  onSelectAllClick,
  stickyTop = 0
}) => (
  <TableHead>
    <TableRow>
      {onSelectAllClick && (
        <TableCell padding="checkbox" sx={{ top: stickyTop }}>
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
            sx={{ top: stickyTop }}
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
  rowCount: PropTypes.number.isRequired,
  stickyTop: PropTypes.number
};

const EmptyState = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '12px',
      color: 'text.disabled'
    }}>
    <SearchOffIcon sx={{ fontSize: 56 }} />
    <Typography variant="subtitle1" component="p" color="text.secondary">
      <Translate>No results</Translate>
    </Typography>
    <Typography variant="body2" color="text.disabled">
      <Translate>Try adjusting your search or filters</Translate>
    </Typography>
  </Box>
);

const JumpToPage = ({ page, totalPages, onPageChange, showLabel = true }) => {
  const { formatMessage } = useIntl();
  const [inputValue, setInputValue] = useState(String(page + 1));

  useEffect(() => {
    setInputValue(String(Math.min(page + 1, totalPages)));
  }, [page, totalPages]);

  // Out-of-range input is clamped rather than reverted: silently snapping "999"
  // back to the current page leaves no way to tell a rejected entry from an
  // applied one. Only non-numeric input restores what was there.
  const commit = value => {
    if (!/^\d+$/.test(value)) {
      setInputValue(String(page + 1));
      return;
    }
    const target = Math.min(Math.max(parseInt(value, 10), 1), totalPages) - 1;
    setInputValue(String(target + 1));
    if (target !== page) onPageChange(null, target);
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {showLabel && (
        <Typography variant="body2" color="text.secondary" noWrap>
          <Translate>Go to page</Translate>
        </Typography>
      )}
      <TextField
        size="small"
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
            'aria-label': formatMessage({ id: 'Go to page' })
          }
        }}
        sx={{
          width: 60,
          '& input': {
            fontSize: theme => theme.typography.body2.fontSize,
            textAlign: 'center',
            // Tight enough for a 48px bar, tall enough to stay a pointer target.
            paddingBlock: 0.75,
            paddingInline: 0.75
          }
        }}
      />
      <Typography variant="body2" color="text.secondary" noWrap>
        / {totalPages}
      </Typography>
    </Box>
  );
};
JumpToPage.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  showLabel: PropTypes.bool
};

const DesktopEntityTable = ({
  entityType,
  entityColumns,
  setEntityColumns,
  isLoading,
  onSelected,
  selectedIds: controlledSelectedIds,
  pageRows,
  nbTotalRows,
  onRowClick,
  pageSizeOptions,
  onPageChange,
  onSortChange,
  onExport,
  isNewQuery,
  shouldHideFooter,
  compact,
  onViewToggle,
  viewMode
}) => {
  const { formatMessage } = useIntl();
  const openLink = useOpenLink();
  const theme = useTheme();
  // Compacted one breakpoint earlier than the layout would suggest: between md
  // and lg the full labels ("Export to CSV", "Change columns") no longer fit
  // next to the pagination, and everything but the results count is
  // `flexShrink: 0` — so the overflow lands on the action buttons.
  const isSmall = useMediaQuery(theme.breakpoints.down('lg'));
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(() =>
    getStoredRowsPerPage(pageSizeOptions)
  );
  const [order, setOrder] = useState('');
  const [orderBy, setOrderBy] = useState('');
  const [internalSelectedIds, setInternalSelectedIds] = useState([]);
  const selected = controlledSelectedIds ?? internalSelectedIds;
  const isSelectionControlled = controlledSelectedIds !== undefined;
  const onSelectedRef = useRef(onSelected);
  onSelectedRef.current = onSelected;
  // Sticky results toolbar + sticky table header both pin to the same card
  // scroller; the header sits just below the toolbar, at its measured height
  // (see hook). 0 when the toolbar isn't rendered (shouldHideFooter).
  const [toolbarRef, toolbarHeight] = useMeasuredHeight();
  // Compact tables scroll inside their own TableContainer while the results
  // toolbar sits outside it. Offsetting the sticky header by the toolbar's
  // height would therefore leave an empty row-sized gap and make the header
  // overlap the first result. Full-page tables share their vertical scroller
  // with the toolbar and still need the measured offset.
  const stickyHeaderTop = compact ? 0 : toolbarHeight;
  const topRef = useRef(null);

  const entityConfig = entitiesConfig[entityType ?? 'placeholder'];

  const visibleColumns = entityColumns.filter(e => e.visible);
  const exportColumns = visibleColumns.map(e => e.apiField || e.field);
  const exportColumnLabels = visibleColumns.map(e => e.label);

  // Back to the top of the TABLE, never to the top of the page: the sentinel
  // marks the start of this block, which on a search page sits below the filter
  // form in the same scroller. Only worth doing once the reader has scrolled
  // past that top — while it is still visible, the filters above it are part of
  // what they are looking at and nothing should move.
  //
  // Two things this must not be. Not `scrollIntoView`, which walks up and
  // scrolls *every* scrollable ancestor, dragging the window along and taking
  // the page header off screen. And not a bare `scrollTop` write, which the
  // scroller's `scroll-behavior: smooth` turns into an animation rather than
  // the immediate correction this is meant to be.
  //
  // One call, on click, is enough: the rows stay in place through the reload
  // (see `isStale`), so nothing reflows underneath afterwards.
  const keepTableTopOnReload = () => {
    const top = topRef.current;
    const scroller = getScrollParent(top);
    if (!top || !scroller) return;
    const delta =
      top.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    if (delta > -1) return;
    scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: 'instant' });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    keepTableTopOnReload();
    if (onPageChange) onPageChange(newPage, rowsPerPage);
  };

  const handleChangeRowsPerPage = event => {
    const nbRowPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(nbRowPerPage);
    localStorage.setItem('entityTable_rowsPerPage', nbRowPerPage);
    setPage(0);
    keepTableTopOnReload();
    if (onPageChange) onPageChange(0, nbRowPerPage);
  };

  // Mount-only: syncs the parent to the rowsPerPage restored from localStorage
  // when it differs from the default. Adding `rowsPerPage`/`onPageChange` to the
  // deps would fire again on every user-driven change and reset `page` to 0
  // after the handlers above have already positioned it.
  useEffect(() => {
    if (onPageChange && rowsPerPage !== pageSizeOptions[0]) {
      onPageChange(0, rowsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRowSelect = (event, doc) => {
    event.stopPropagation();
    const newSelected = [...selected];
    const selectedIndex = selected.indexOf(doc.id);
    if (selectedIndex === -1) {
      newSelected.push(doc.id);
    } else {
      newSelected.splice(selectedIndex, 1);
    }
    if (!isSelectionControlled) setInternalSelectedIds(newSelected);
    onSelected(newSelected);
  };

  const handleRowClick = (event, doc) => {
    if (onSelected && !onRowClick) {
      handleRowSelect(event, doc);
      return;
    }
    if (onRowClick) {
      const shouldContinue = onRowClick(doc);
      if (!shouldContinue) return;
    }
    const url = entityConfig.link(doc);
    if (!url) return;
    openLink(url);
  };

  const handleRequestSort = (event, property) => {
    const fieldMap = SORT_FIELD_MAP[entityType];
    if (!fieldMap || !(property in fieldMap)) {
      console.warn(
        `Sort blocked: field "${property}" is not allowed for entity type "${entityType}"`
      );
      return;
    }
    const apiField = fieldMap[property];
    // A re-sort reshuffles the whole result set, so staying at row 150 is as
    // wrong as it is after a page change.
    keepTableTopOnReload();
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
    if (!isSelectionControlled) setInternalSelectedIds(newSelected);
    onSelected(newSelected);
  };

  useEffect(() => {
    if (!isNewQuery) return;
    setPage(0);
    setOrder('');
    setOrderBy('');
    setInternalSelectedIds([]);
    if (isSelectionControlled && onSelectedRef.current) {
      onSelectedRef.current([]);
    }
  }, [isNewQuery, isSelectionControlled]);

  const colSpan = visibleColumns.length + (onSelected ? 1 : 0);

  // Plain CSV export (every entity type but entrances, which gets a format
  // menu). A tooltip only where it adds something: the reason the button is
  // dead, or the name of an icon left without its label.
  const isCsvExportDisabled = nbTotalRows > MAX_DOCUMENTS_TO_EXPORT_IN_CSV;
  const csvLabel = formatMessage({ id: 'Export to CSV' });
  let csvTooltip = null;
  if (isCsvExportDisabled) {
    csvTooltip = formatMessage({
      id: 'Export unavailable above 10000 results'
    });
  } else if (isSmall) {
    csvTooltip = csvLabel;
  }

  // Two loading shapes: `isPending` has nothing on screen yet and gets the
  // skeleton, `isStale` still holds the rows it is about to replace and keeps
  // showing them.
  const isPending = isLoading && pageRows.length === 0;
  const isStale = isLoading && pageRows.length > 0;

  const totalPages =
    nbTotalRows == null ? 1 : Math.max(1, Math.ceil(nbTotalRows / rowsPerPage));

  // Two independent conditions, because the two controls stop being useful at
  // different moments. Navigation is dead as soon as everything fits on one
  // page — showing "1 / 1" next to four disabled arrows is pure noise. The size
  // selector has to survive that case: with 50 results and 200/page remembered
  // from a previous search, it is the only way back to a smaller page.
  const hasNavigation = onPageChange && nbTotalRows != null && totalPages > 1;
  const hasPageSizeSelector =
    onPageChange &&
    nbTotalRows != null &&
    nbTotalRows > Math.min(...pageSizeOptions);

  const TableContent =
    pageRows.length === 0 ? (
      <TableRow>
        <TableCell colSpan={colSpan} sx={{ border: 0, p: 0.25 }}>
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
      {/* Marks the top of the table for scrollToTableTop. Deliberately outside
          the sticky wrapper: a pinned element reports its pinned box, so it
          could never tell us how far the rows have been scrolled. */}
      <div ref={topRef} />
      {!shouldHideFooter && (
        <Box
          ref={toolbarRef}
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.appBar - 1,
            bgcolor: 'background.paper'
          }}>
          <Toolbar
            disableGutters
            variant="dense"
            sx={{
              display: 'flex',
              alignItems: 'center',
              minHeight: 48,
              // Override the theme's app-bar-specific fixed Toolbar height.
              height: 'auto',
              flexWrap: 'nowrap',
              gap: { xs: 1, sm: 2 }
            }}>
            {nbTotalRows != null && (
              // Stays mounted while loading. Unmounting it slid the whole
              // pagination cluster ~145px left mid-click, so the arrow the user
              // had just pressed moved out from under the cursor.
              <Typography
                variant="body2"
                color="text.secondary"
                aria-live="polite"
                sx={{
                  minWidth: 0,
                  flex: '1 1 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  opacity: isLoading ? 0.5 : 1,
                  transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.shortest
                  })
                }}>
                {formatMessage({ id: 'results_count' }, { count: nbTotalRows })}
                {hasNavigation && (
                  <Box component="span" sx={VISUALLY_HIDDEN}>
                    {formatMessage(
                      { id: 'page_position' },
                      { page: page + 1, total: totalPages }
                    )}
                  </Box>
                )}
              </Typography>
            )}
            {/* Pagination rides in this bar rather than in a footer of its own:
                the bar is already sticky and already paid for, so the controls
                cost zero extra height and cannot fall below the fold. */}
            {hasNavigation && (
              <Box
                component="nav"
                aria-label={formatMessage({ id: 'Pagination' })}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flexShrink: 0
                }}>
                <JumpToPage
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handleChangePage}
                  showLabel={!isSmall}
                />
                <TablePagination
                  showFirstButton={!isSmall}
                  showLastButton={!isSmall}
                  // Empty on purpose: the page-size selector lives in the
                  // settings cluster on the right, so only the arrows remain.
                  rowsPerPageOptions={[]}
                  component="div"
                  count={nbTotalRows}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  sx={INLINE_PAGINATION_SX}
                  getItemAriaLabel={type =>
                    formatMessage({ id: PAGE_BUTTON_LABEL[type] })
                  }
                  slotProps={{
                    actions: {
                      // Prev/next carry the traffic, so they are the two that
                      // get the accent; first/last stay neutral behind them.
                      previousButton: {
                        color: 'primary',
                        title: formatMessage({ id: 'Previous page' })
                      },
                      nextButton: {
                        color: 'primary',
                        title: formatMessage({ id: 'Next page' })
                      },
                      firstButton: {
                        title: formatMessage({ id: 'First page' })
                      },
                      lastButton: { title: formatMessage({ id: 'Last page' }) }
                    }
                  }}
                  onPageChange={handleChangePage}
                />
              </Box>
            )}
            <Box
              sx={{
                minWidth: 0,
                display: 'flex',
                gap: 0.5,
                alignItems: 'center',
                flexShrink: 0,
                ml: 'auto'
              }}>
              {hasPageSizeSelector && (
                // A display setting, same family as "Change columns" — hence
                // this cluster rather than the navigation one, where it used to
                // sit between the page number and the arrows it has nothing to
                // do with.
                <Select
                  variant="standard"
                  value={rowsPerPage}
                  onChange={handleChangeRowsPerPage}
                  renderValue={value =>
                    formatMessage(
                      { id: 'rows_per_page_short' },
                      { count: value }
                    )
                  }
                  slotProps={{
                    input: {
                      'aria-label': formatMessage({ id: 'Results per page:' })
                    }
                  }}
                  sx={{
                    fontSize: theme.typography.body2.fontSize,
                    color: 'text.secondary',
                    height: TOOLBAR_ACTION_HEIGHT
                  }}>
                  {pageSizeOptions.map(size => (
                    <MenuItem key={size} value={size}>
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              )}
              {onExport && entityType === 'entrances' && (
                <ExportFormatDropdown
                  disabled={nbTotalRows > MAX_DOCUMENTS_TO_EXPORT_IN_CSV}
                  iconOnly={isSmall}
                  onExport={format => {
                    onExport(exportColumns, exportColumnLabels, format);
                  }}
                />
              )}
              {onExport && entityType !== 'entrances' && (
                <ToolbarActionButton
                  icon={FileDownloadIcon}
                  label={isSmall ? null : csvLabel}
                  tooltip={csvTooltip}
                  disabled={isCsvExportDisabled}
                  onClick={() => {
                    onExport(exportColumns, exportColumnLabels);
                  }}
                />
              )}
              {!compact && (
                <VisibleColumnsMenu
                  columns={entityColumns}
                  setColumns={setEntityColumns}
                  entityType={entityType}
                  label={isSmall ? null : 'Change columns'}
                  menuTitle="Change columns"
                  icon={ViewColumnIcon}
                />
              )}
              <ToolbarActionButton
                icon={ViewListIcon}
                tooltip={formatMessage({
                  id: viewMode === 'table' ? 'Card view' : 'Table view'
                })}
                onClick={onViewToggle}
              />
            </Box>
          </Toolbar>
          <Divider />
        </Box>
      )}
      {isLoading && <LinearProgress color="secondary" />}
      <TableContainer
        sx={
          compact
            ? // Embedded (compact) tables keep their own inner horizontal
              // scroll — they live inside other scroll areas, not the search
              // page's single-scroll card.
              { overflowX: 'auto', maxWidth: '100%' }
            : // Full-page tables must NOT scroll on their own: overflow visible
              // keeps this box from becoming a scroll container, so the sticky
              // header escapes to the shared card scroller (CardContent), the
              // same one the results toolbar sticks to. Horizontal scroll for
              // wide tables is handled there instead.
              { overflow: 'visible' }
        }>
        <Table
          stickyHeader
          size="small"
          aria-busy={isLoading}
          sx={{
            minWidth: compact ? 300 : 750,
            // Stale-while-revalidate: the rows being replaced stay put, dimmed,
            // instead of collapsing into a skeleton. Swapping them out changed
            // the scroller's height by thousands of pixels mid-reload, which
            // moved the reader away from the rows they were on. Nothing to
            // preserve on a first load, so the skeleton still runs there.
            ...(isStale && {
              opacity: 0.5,
              pointerEvents: 'none',
              transition: theme.transitions.create('opacity', {
                duration: theme.transitions.duration.shortest
              })
            })
          }}>
          {isPending ? (
            <LoadingTableHead stickyTop={stickyHeaderTop} />
          ) : (
            <EntityTableHead
              stickyTop={stickyHeaderTop}
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
            {isPending ? <LoadingTableBodyInner /> : TableContent}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

DesktopEntityTable.propTypes = {
  entityType: PropTypes.string,
  entityColumns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setEntityColumns: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  onSelected: PropTypes.func,
  selectedIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ),
  pageRows: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  nbTotalRows: PropTypes.number,
  onRowClick: PropTypes.func,
  pageSizeOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  onPageChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onExport: PropTypes.func,
  isNewQuery: PropTypes.bool,
  shouldHideFooter: PropTypes.bool,
  compact: PropTypes.bool,
  onViewToggle: PropTypes.func,
  viewMode: PropTypes.string
};

export default DesktopEntityTable;
