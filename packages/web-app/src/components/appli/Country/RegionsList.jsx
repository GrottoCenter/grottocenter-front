import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Typography,
  Skeleton,
  Pagination,
  Box
} from '@mui/material';
import PropTypes from 'prop-types';
import { regionsSearchUrl } from '../../../conf/apiRoutes';
import GCLink from '../../common/GCLink';

const fetchRegions = async (countryId, page, limit = 10) => {
  try {
    const offset = (page - 1) * limit;
    const response = await fetch(
      `${regionsSearchUrl}?query=${countryId}-&offset=${offset}&limit=${limit}`,
      {
        method: 'POST'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const regions = (data.results || []).filter(
      item =>
        item.type === 'region' &&
        item.iso &&
        item.iso.startsWith(`${countryId}-`)
    );

    return {
      regions,
      totalCount: data.totalCount || 0,
      totalPages: data.totalPages || Math.ceil((data.totalCount || 0) / limit)
    };
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }
};

const RegionsList = ({ countryId }) => {
  const { formatMessage } = useIntl();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 10;

  useEffect(() => {
    if (!countryId) return;

    const loadRegions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchRegions(countryId, page, limit);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRegions();
  }, [countryId, page]);

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const regions = data?.regions || [];
  const totalPages = data?.totalPages || 0;
  const shouldShowPagination = totalPages > 1;

  if (isLoading) {
    return (
      <>
        <Skeleton height={30} />
        <Skeleton height={30} />
        <Skeleton height={30} />
      </>
    );
  }

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {formatMessage({ id: 'Error loading regions' })}
      </Typography>
    );
  }

  if (!regions || (regions.length === 0 && page === 1)) {
    return (
      <Typography variant="body2" color="textSecondary">
        {formatMessage({ id: 'No regions found' })}
      </Typography>
    );
  }

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {formatMessage({ id: 'Regions' })}
      </Typography>
      <TableContainer component={Paper} style={{ width: '500px' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{formatMessage({ id: 'Region' })}</TableCell>
              <TableCell>{formatMessage({ id: 'ISO' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {regions.map(region => (
              <TableRow key={region.iso}>
                <TableCell component="th" scope="row">
                  <GCLink
                    internal
                    href={`/ui/countries/${countryId}/regions/${region.iso.split('-')[1]}`}>
                    {region.name}
                  </GCLink>
                </TableCell>
                <TableCell align="right">{region.iso}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {shouldShowPagination && (
        <Box mt={2} display="flex" justifyContent="center">
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            disabled={isLoading}
            color="primary"
          />
        </Box>
      )}
    </>
  );
};

RegionsList.propTypes = {
  countryId: PropTypes.string.isRequired
};

export default RegionsList;
