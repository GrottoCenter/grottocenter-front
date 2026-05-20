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
  Stack,
  Typography
} from '@mui/material';
import Translate from '../Translate';

const MobileEntityCard = ({ doc, columns, link, renderCellFn }) => {
  const navigate = useNavigate();
  const titleCol =
    columns.find(c => c.field === 'name' || c.field === 'title') ?? columns[0];
  const bodyColumns = columns.filter(c => c !== titleCol && c.field !== 'id');

  return (
    <Card>
      <CardActionArea onClick={() => navigate(link(doc))}>
        <CardContent>
          <Typography
            variant="subtitle1"
            color="secondary"
            fontWeight="bold"
            gutterBottom>
            {renderCellFn(doc, titleCol.field, titleCol.render)}
          </Typography>
          {bodyColumns.length > 0 && (
            <Box
              sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
              {bodyColumns.map(col => (
                <Box key={col.field}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block">
                    <Translate>{col.label}</Translate>
                  </Typography>
                  <Typography variant="body2">
                    {renderCellFn(doc, col.field, col.render)}
                  </Typography>
                </Box>
              ))}
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
  renderCellFn: PropTypes.func.isRequired
};

const MobileEntityList = ({
  rows,
  columns,
  totalRows,
  isLoading,
  onPageChange,
  rowsPerPage,
  link,
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
      <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">
          <Translate>No results</Translate>
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 1 }}>
        {allRows.map(doc => (
          <MobileEntityCard
            key={doc.id}
            doc={doc}
            columns={columns}
            link={link}
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
  renderCellFn: PropTypes.func.isRequired
};

export default MobileEntityList;
