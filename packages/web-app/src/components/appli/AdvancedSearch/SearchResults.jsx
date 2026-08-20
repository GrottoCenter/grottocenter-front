import PropTypes from 'prop-types';
import { useAdvancedSearch, refineAdvancedSearch } from '../../../hooks';
import { downloadAdvancedSearchResults } from '../../../actions/Advancedsearch';
import EntityTable from '../../common/EntityTable';

const SearchResults = ({ onSelected, hideExport, entityType, compact }) => {
  const { data, isFetching, isNewQuery, params } = useAdvancedSearch();
  const results = data?.results;
  const totalResults = data?.totalResults ?? 0;

  if (entityType && params?.entity !== entityType) return null;

  return (
    <EntityTable
      entityType={params?.entity}
      isLoading={isFetching}
      isNewQuery={isNewQuery}
      pageRows={results}
      nbTotalRows={totalResults}
      onPageChange={
        params
          ? (pageNum, pageSize) =>
              refineAdvancedSearch({
                ...params,
                page: pageNum + 1,
                size: pageSize
              })
          : null
      }
      onSortChange={
        params ? sort => refineAdvancedSearch({ ...params, sort }) : null
      }
      onExport={
        hideExport
          ? null
          : (columns, columnsName, format) => {
              downloadAdvancedSearchResults({
                ...params,
                columns,
                columnsName,
                format
              });
            }
      }
      onSelected={!onSelected ? null : ids => onSelected(ids, results)}
      compact={compact}
    />
  );
};

SearchResults.propTypes = {
  onSelected: PropTypes.func,
  hideExport: PropTypes.bool,
  entityType: PropTypes.string,
  compact: PropTypes.bool
};

export default SearchResults;
