import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import useOpenLink from '../../../hooks/useOpenLink';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import Translate from '../Translate';

const MobileEntityCard = React.memo(
  ({
    doc,
    columns,
    link,
    renderCellFn,
    icon,
    selected = false,
    onToggle = null
  }) => {
    const openLink = useOpenLink();
    const titleCol =
      columns.find(c => c.isTitle) ??
      columns.find(c => c.field === 'name' || c.field === 'title') ??
      columns[0];
    const bodyColumns = columns.filter(c => c !== titleCol);

    const handleClick = () => {
      if (onToggle) {
        onToggle(doc.id);
      } else {
        openLink(link(doc));
      }
    };

    return (
      <Card
        sx={{
          outline: '1px solid',
          outlineColor: 'primary.main',
          bgcolor: selected ? 'action.selected' : 'background.paper',
          transition: 'background-color 0.15s'
        }}>
        <CardActionArea onClick={handleClick}>
          <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 0.5
              }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {onToggle && (
                  <Checkbox
                    checked={selected}
                    size="small"
                    color="primary"
                    onClick={e => e.stopPropagation()}
                    onChange={() => onToggle(doc.id)}
                    sx={{ p: 0, mr: 0.5, flexShrink: 0 }}
                  />
                )}
                {icon}
                <Typography
                  variant="subtitle1"
                  color="secondary"
                  fontWeight="bold"
                  sx={{ fontSize: '1.5rem', lineHeight: 1.3 }}>
                  {renderCellFn(doc, titleCol.field, titleCol.render)}
                </Typography>
              </Box>
              {!onToggle && (
                <ChevronRightIcon
                  fontSize="small"
                  sx={{ color: 'text.disabled', flexShrink: 0, ml: 0.5 }}
                />
              )}
            </Box>
            <Divider sx={{ mb: 0.5 }} />
            {bodyColumns.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                {bodyColumns.map(col => {
                  const value = renderCellFn(doc, col.field, col.render);
                  const isMissing = value === '-';
                  return (
                    <Box
                      key={col.field}
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ minWidth: '35%', flexShrink: 0 }}>
                        <Translate>{col.label}</Translate>
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={isMissing ? 'normal' : 500}
                        color={isMissing ? 'text.disabled' : 'text.primary'}>
                        {value}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </CardActionArea>
      </Card>
    );
  }
);

MobileEntityCard.displayName = 'MobileEntityCard';

MobileEntityCard.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  link: PropTypes.func.isRequired,
  renderCellFn: PropTypes.func.isRequired,
  icon: PropTypes.node,
  selected: PropTypes.bool,
  onToggle: PropTypes.func
};

// ~600 cards ≈ 30 "Load more" clicks × 20 rows/page, capped to prevent DOM bloat on mobile.
const MAX_ACCUMULATED_ROWS = 600;

const MobileEntityList = ({
  rows,
  columns,
  totalRows,
  isLoading,
  isNewQuery,
  onPageChange,
  rowsPerPage,
  link,
  icon,
  renderCellFn,
  onSelected = null
}) => {
  const [allRows, setAllRows] = useState(rows ?? []);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState([]);
  const isAppending = useRef(false);
  const hasInteracted = useRef(false);
  // Keep a stable ref to the callback so handleToggle never changes reference
  const onSelectedRef = useRef(onSelected);
  onSelectedRef.current = onSelected;

  useEffect(() => {
    if (!isNewQuery) return;
    setAllRows([]);
    setPage(0);
    setSelectedIds([]);
    hasInteracted.current = false;
    isAppending.current = false;
  }, [isNewQuery]);

  useEffect(() => {
    if (isAppending.current) {
      setAllRows(prev => {
        const next = [...prev, ...(rows ?? [])];
        return next.length > MAX_ACCUMULATED_ROWS
          ? next.slice(0, MAX_ACCUMULATED_ROWS)
          : next;
      });
    } else {
      setAllRows(rows ?? []);
    }
    isAppending.current = false;
  }, [rows]);

  // Notify parent only when selection actually changes, not on mount
  useEffect(() => {
    if (!hasInteracted.current) return;
    if (onSelectedRef.current) onSelectedRef.current(selectedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds]);

  // Stable reference — does not depend on onSelected directly
  const handleToggle = useCallback(id => {
    hasInteracted.current = true;
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleLoadMore = () => {
    isAppending.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
    if (onPageChange) onPageChange(nextPage, rowsPerPage);
  };

  const hasMore =
    totalRows != null &&
    allRows.length < totalRows &&
    allRows.length < MAX_ACCUMULATED_ROWS;

  if (allRows.length === 0 && !isLoading) {
    return (
      <Box sx={{ py: 4, textAlign: 'center', color: 'text.disabled' }}>
        <SearchOffIcon sx={{ fontSize: 48, mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          <Translate>No results</Translate>
        </Typography>
        <Typography variant="caption" color="text.disabled">
          <Translate>Try adjusting your search or filters</Translate>
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2} sx={{ mb: 1 }}>
        {allRows.map(doc => (
          <MobileEntityCard
            key={doc.id}
            doc={doc}
            columns={columns}
            link={link}
            icon={icon}
            renderCellFn={renderCellFn}
            selected={onSelected ? selectedIds.includes(doc.id) : false}
            onToggle={onSelected ? handleToggle : null}
          />
        ))}
      </Stack>
      {(hasMore || isLoading) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          {isLoading ? (
            <CircularProgress size={24} color="secondary" />
          ) : (
            <Button variant="outlined" onClick={handleLoadMore}>
              <Translate>Load more</Translate>
              {` (${allRows.length} / ${totalRows})`}
            </Button>
          )}
        </Box>
      )}
      {!hasMore && allRows.length >= MAX_ACCUMULATED_ROWS && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', textAlign: 'center', py: 1 }}>
          <Translate>Refine your search to see more results</Translate>
        </Typography>
      )}
    </Box>
  );
};

MobileEntityList.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({})),
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  totalRows: PropTypes.number,
  isLoading: PropTypes.bool,
  isNewQuery: PropTypes.bool,
  onPageChange: PropTypes.func,
  rowsPerPage: PropTypes.number.isRequired,
  link: PropTypes.func.isRequired,
  icon: PropTypes.node,
  renderCellFn: PropTypes.func.isRequired,
  onSelected: PropTypes.func
};

export default MobileEntityList;
