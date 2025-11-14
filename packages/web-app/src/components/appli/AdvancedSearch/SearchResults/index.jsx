import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNextAdvancedsearchResults,
  fetchFullAdvancedsearchResults
} from '../../../../actions/Advancedsearch';
import SearchResultsTable from './SearchResultsTable';

const SearchResults = ({ onRowClick, selectedIds, hideExport }) => {
  const {
    fullResults,
    isLoading,
    isLoadingFullData,
    results,
    totalNbResults,
    wantToDownloadCSV,
    searchCriterias: { resourceType }
  } = useSelector(state => state.advancedsearch);

  const dispatch = useDispatch();

  const getNewResults = (from, size) => {
    dispatch(fetchNextAdvancedsearchResults(from, size));
  };

  const getFullResults = () => {
    dispatch(fetchFullAdvancedsearchResults());
  };
  return (
    <SearchResultsTable
      getFullResults={getFullResults}
      getNewResults={getNewResults}
      fullResults={fullResults}
      isLoading={isLoading}
      isLoadingFullData={isLoadingFullData}
      resourceType={resourceType || ''}
      results={results}
      totalNbResults={totalNbResults}
      wantToDownloadCSV={wantToDownloadCSV}
      onRowClick={onRowClick}
      selectedIds={selectedIds}
      hideExport={hideExport}
    />
  );
};

SearchResults.propTypes = {
  onRowClick: PropTypes.func,
  selectedIds: PropTypes.arrayOf(PropTypes.string.isRequired),
  hideExport: PropTypes.bool
};

export default SearchResults;
