import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdvancedSearchResults,
  downloadAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import EntityTable from '../../common/EntityTable/EntityTable';

const SearchResults = ({ onSelected, hideExport, entityType }) => {
  const dispatch = useDispatch();
  const { isNewQuery, queryParams, isLoading, results, totalResults } =
    useSelector(state => state.advancedsearch);

  if (entityType && queryParams?.entity !== entityType) return null;

  return (
    <EntityTable
      entityType={queryParams?.entity}
      isLoading={isLoading}
      isNewQuery={isNewQuery}
      pageRows={results}
      nbTotalRows={totalResults}
      onPageChange={
        queryParams
          ? (pageNum, pageSize) => {
              const newQueryParams = { ...queryParams };
              newQueryParams.page = pageNum + 1;
              newQueryParams.size = pageSize;
              dispatch(fetchAdvancedSearchResults(newQueryParams, false));
            }
          : null
      }
      onSortChange={
        queryParams
          ? sort => {
              const newQueryParams = { ...queryParams };
              newQueryParams.sort = sort;
              dispatch(fetchAdvancedSearchResults(newQueryParams, false));
            }
          : null
      }
      onCSVDownload={
        hideExport
          ? null
          : (columns, columnsName) => {
              downloadAdvancedSearchResults({ ...queryParams, columns, columnsName });
            }
      }
      onSelected={!onSelected ? null : ids => onSelected(ids, results)}
      onRowClick={onSelected ? () => false : null}
    />
  );
};

SearchResults.propTypes = {
  onSelected: PropTypes.func,
  hideExport: PropTypes.bool,
  entityType: PropTypes.string
};

export default SearchResults;
