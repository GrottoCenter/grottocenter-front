import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdvancedSearchResults,
  downloadAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import EntityTable from '../../common/EntityTable/EntityTable';

const SearchResults = ({ onSelected }) => {
  const dispatch = useDispatch();
  const { isNewQuery, queryParams, isLoading, results, totalResults } =
    useSelector(state => state.advancedsearch);

  return (
    <EntityTable
      entityType={queryParams?.entity}
      isLoading={isLoading}
      isNewQuery={isNewQuery}
      pageRows={results}
      nbTotalRows={totalResults}
      onPageChange={(pageNum, pageSize) => {
        if (!queryParams) {
          console.error('onPageChange Missing query params');
          return;
        }
        const newQueryParams = { ...queryParams };
        newQueryParams.page = pageNum + 1;
        newQueryParams.size = pageSize;
        dispatch(fetchAdvancedSearchResults(newQueryParams, false));
      }}
      onSortChange={sort => {
        if (!queryParams) {
          console.error('onSortChange Missing query params');
          return;
        }
        const newQueryParams = { ...queryParams };
        newQueryParams.sort = sort;
        dispatch(fetchAdvancedSearchResults(newQueryParams, false));
      }}
      onCSVDownload={(columns, columnsName) => {
        downloadAdvancedSearchResults({ ...queryParams, columns, columnsName });
      }}
      onSelected={!onSelected ? null : ids => onSelected(ids, results)}
    />
  );
};

SearchResults.propTypes = {
  onSelected: PropTypes.func
};

export default SearchResults;
