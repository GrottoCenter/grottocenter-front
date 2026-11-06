import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import Alert from '@/components/common/Alert';
import FetchErrorState from '@/components/common/FetchErrorState';
import { isNetworkError } from '@/utils/networkError';
import {
  useAdvancedSearch,
  refineAdvancedSearch,
  useOnlineStatus
} from '../../../hooks';
import { downloadAdvancedSearchResults } from '../../../actions/Advancedsearch';
import EntityTable from '../../common/EntityTable';

const SearchResults = ({
  onSelected,
  onRowClick,
  hideExport,
  entityType,
  entityColumnsModifier,
  compact
}) => {
  const { formatMessage } = useIntl();
  const isOnline = useOnlineStatus();
  const {
    data,
    isFetching,
    isPlaceholderData,
    isNewQuery,
    params,
    isError,
    error,
    fetchStatus,
    refetch
  } = useAdvancedSearch();
  const isOffline = !isOnline || fetchStatus === 'paused';
  const results = data?.results;
  const totalResults = data?.totalResults ?? 0;

  if (entityType && params?.entity !== entityType) return null;

  return (
    <>
      {params?.entity && isOffline && (
        <Alert
          data-testid="offline-search-state"
          severity="info"
          content={formatMessage({ id: 'offlineSearchUnavailable' })}
        />
      )}
      {isError && (!isOffline || !isNetworkError(error)) && (
        <FetchErrorState
          error={error}
          messageId="unexpected error"
          onRetry={() => refetch()}
        />
      )}
      {/* Keep table controls mounted if a page change is interrupted, but never
          present the previous page as the unavailable page's offline results. */}
      <div hidden={isOffline && isPlaceholderData}>
        <EntityTable
          entityType={params?.entity}
          entityColumnsModifier={entityColumnsModifier}
          isOffline={isOffline}
          isLoading={isFetching || isPlaceholderData}
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
          onRowClick={onRowClick}
          compact={compact}
        />
      </div>
    </>
  );
};

SearchResults.propTypes = {
  onSelected: PropTypes.func,
  onRowClick: PropTypes.func,
  hideExport: PropTypes.bool,
  entityType: PropTypes.string,
  entityColumnsModifier: PropTypes.func,
  compact: PropTypes.bool
};

export default SearchResults;
