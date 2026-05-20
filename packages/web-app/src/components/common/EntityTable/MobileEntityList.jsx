import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Divider,
  Stack,
  Typography
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import Translate from '../Translate';

const MobileEntityCard = ({ doc, columns, link, renderCellFn, icon }) => {
  const navigate = useNavigate();
  const titleCol =
    columns.find(c => c.field === 'name' || c.field === 'title') ?? columns[0];
  const bodyColumns = columns.filter(c => c !== titleCol);

  return (
    <Card sx={{ outline: '1px solid', outlineColor: 'primary.main' }}>
      <CardActionArea onClick={() => navigate(link(doc))}>
        <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.5
            }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {icon}
              <Typography
                variant="subtitle1"
                color="secondary"
                fontWeight="bold"
                sx={{ fontSize: '1.5rem', lineHeight: 1.3 }}>
                {renderCellFn(doc, titleCol.field, titleCol.render)}
              </Typography>
            </Box>
            <ChevronRightIcon
              fontSize="small"
              sx={{ color: 'text.disabled', flexShrink: 0, ml: 0.5 }}
            />
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
                    sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
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
};

MobileEntityCard.propTypes = {
  doc: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  link: PropTypes.func.isRequired,
  renderCellFn: PropTypes.func.isRequired,
  icon: PropTypes.node
};

const MobileEntityList = ({
  rows,
  columns,
  totalRows,
  isLoading,
  onPageChange,
  rowsPerPage,
  link,
  icon,
  renderCellFn
}) => {
  const [allRows, setAllRows] = useState(rows ?? []);
  const [page, setPage] = useState(0);
  const isAppending = useRef(false);

  useEffect(() => {
    if (isAppending.current) {
      setAllRows(prev => [...prev, ...(rows ?? [])]);
    } else {
      setAllRows(rows ?? []);
      setPage(0);
    }
    isAppending.current = false;
  }, [rows]);

  const handleLoadMore = () => {
    isAppending.current = true;
    const nextPage = page + 1;
    setPage(nextPage);
    if (onPageChange) onPageChange(nextPage, rowsPerPage);
  };

  const hasMore = totalRows != null && allRows.length < totalRows;

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
    </Box>
  );
};

MobileEntityList.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({})),
  columns: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  totalRows: PropTypes.number,
  isLoading: PropTypes.bool,
  onPageChange: PropTypes.func,
  rowsPerPage: PropTypes.number.isRequired,
  link: PropTypes.func.isRequired,
  icon: PropTypes.node,
  renderCellFn: PropTypes.func.isRequired
};

export default MobileEntityList;
