import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { isMobile } from 'react-device-detect';
import { Box, Divider, IconButton, LinearProgress, Tooltip } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useIntl } from 'react-intl';

import entitiesConfig from './entitiesConfig';
import DesktopEntityTable from './DesktopEntityTable';
import ExportFormatDropdown from './ExportFormatDropdown';
import MobileEntityList from './MobileEntityList';
import MobileToolbar from './MobileToolbar';
import {
  SORT_FIELD_MAP,
  applyColumnVisibility,
  getStoredRowsPerPage,
  renderCell
} from './tableUtils';

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 100, 200];

const initColumns = (
  entityConfig,
  entityType,
  compact,
  entityColumnsModifier
) => {
  let columns;
  if (compact) {
    columns = entityConfig.columns.map(col => ({
      ...col,
      visible: col.field === 'name'
    }));
  } else {
    const storageKey = `entityTable_${entityType}_columns`;
    const stored = localStorage.getItem(storageKey);
    columns = stored
      ? applyColumnVisibility(entityConfig.columns, stored)
      : entityConfig.columns;
  }
  if (entityColumnsModifier) entityColumnsModifier(columns);
  return columns;
};

const MAX_EXPORT_ROWS = 10000;

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
  onExport,
  isNewQuery = false,
  shouldHideFooter = false,
  compact = false
}) => {
  const { formatMessage } = useIntl();
  const entityConfig = entitiesConfig[entityType ?? 'placeholder'];

  const [entityColumns, setEntityColumns] = useState(() =>
    initColumns(entityConfig, entityType, compact, entityColumnsModifier)
  );

  // Mobile-only sort state (DesktopEntityTable manages its own internally)
  const [mobileOrder, setMobileOrder] = useState('');
  const [mobileOrderBy, setMobileOrderBy] = useState('');
  const [rowsPerPage] = useState(() => getStoredRowsPerPage(pageSizeOptions));
  const [viewMode, setViewMode] = useState(isMobile ? 'cards' : 'table');
  const toggleViewMode = () =>
    setViewMode(v => (v === 'cards' ? 'table' : 'cards'));

  useEffect(() => {
    setEntityColumns(
      initColumns(entityConfig, entityType, compact, entityColumnsModifier)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, compact]);

  useEffect(() => {
    if (!isNewQuery) return;
    setMobileOrder('');
    setMobileOrderBy('');
  }, [isNewQuery]);

  if (!pageRows) return null;

  if (viewMode === 'cards') {
    const sortableColumns = entityColumns.filter(
      c => c.sortable && SORT_FIELD_MAP[entityType]?.[c.field]
    );
    const visibleColumns = entityColumns.filter(e => e.visible);

    const handleMobileSortFieldChange = e => {
      const field = e.target.value;
      if (!field) {
        setMobileOrderBy('');
        setMobileOrder('');
        if (onSortChange) onSortChange('');
        return;
      }
      const apiField = SORT_FIELD_MAP[entityType]?.[field];
      if (!apiField) return;
      setMobileOrderBy(field);
      setMobileOrder('asc');
      if (onSortChange) onSortChange(`${apiField}:asc`);
    };

    const handleMobileSortDirToggle = () => {
      if (!mobileOrderBy) return;
      const apiField =
        SORT_FIELD_MAP[entityType]?.[mobileOrderBy] ?? mobileOrderBy;
      const newOrder = mobileOrder === 'asc' ? 'desc' : 'asc';
      setMobileOrder(newOrder);
      if (onSortChange) onSortChange(`${apiField}:${newOrder}`);
    };

    return (
      <Box sx={{ width: '100%' }}>
        {!shouldHideFooter && (
          <>
            <MobileToolbar
              sortableColumns={onSortChange ? sortableColumns : []}
              order={mobileOrder}
              orderBy={mobileOrderBy}
              onSortFieldChange={handleMobileSortFieldChange}
              onSortDirToggle={handleMobileSortDirToggle}
              compact={compact}
              entityColumns={entityColumns}
              setEntityColumns={setEntityColumns}
              entityType={entityType}
              onViewToggle={toggleViewMode}
              viewMode={viewMode}
              exportSlot={(() => {
                if (!onExport) return undefined;
                const exportDisabled =
                  nbTotalRows != null && nbTotalRows > MAX_EXPORT_ROWS;
                const exportCols = visibleColumns.map(
                  c => c.apiField || c.field
                );
                const exportLabels = visibleColumns.map(c => c.label);
                if (entityType === 'entrances') {
                  return (
                    <ExportFormatDropdown
                      disabled={exportDisabled}
                      onExport={format =>
                        onExport(exportCols, exportLabels, format)
                      }
                      iconOnly
                    />
                  );
                }
                return (
                  <Tooltip title={formatMessage({ id: 'Export' })}>
                    <span>
                      <IconButton
                        size="small"
                        color="primary"
                        disabled={exportDisabled}
                        onClick={() => onExport(exportCols, exportLabels)}
                        sx={{
                          border: '1px solid',
                          borderColor: exportDisabled
                            ? 'action.disabled'
                            : 'primary.main',
                          borderRadius: 1
                        }}>
                        <FileDownloadIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                );
              })()}
            />
            <Divider />
          </>
        )}
        {isLoading && <LinearProgress color="secondary" />}
        <MobileEntityList
          rows={pageRows}
          columns={visibleColumns}
          totalRows={nbTotalRows}
          isLoading={isLoading}
          isNewQuery={isNewQuery}
          onPageChange={
            onPageChange
              ? (page, size) => onPageChange(page, size ?? rowsPerPage)
              : null
          }
          rowsPerPage={rowsPerPage}
          link={entityConfig.link}
          icon={entityConfig.icon}
          renderCellFn={renderCell}
        />
      </Box>
    );
  }

  return (
    <DesktopEntityTable
      entityType={entityType}
      entityColumns={entityColumns}
      setEntityColumns={setEntityColumns}
      isLoading={isLoading}
      onSelected={onSelected}
      pageRows={pageRows}
      nbTotalRows={nbTotalRows}
      onRowClick={onRowClick}
      pageSizeOptions={pageSizeOptions}
      onPageChange={onPageChange}
      onSortChange={onSortChange}
      onExport={onExport}
      isNewQuery={isNewQuery}
      shouldHideFooter={shouldHideFooter}
      compact={compact}
      onViewToggle={toggleViewMode}
      viewMode={viewMode}
    />
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
  onExport: PropTypes.func,
  isNewQuery: PropTypes.bool,
  shouldHideFooter: PropTypes.bool,
  compact: PropTypes.bool
};

export default EntityTable;
