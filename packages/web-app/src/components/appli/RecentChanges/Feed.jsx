import { Box, Button, CircularProgress } from '@mui/material';
import { useIntl } from 'react-intl';

import RecentChangesList from '@/components/common/RecentChangesList';
import { useRecentChangesFeed } from '@/hooks';
import { RecentChangesFiltersPropTypes } from '@/types/recentChanges';

const RecentChangesFeed = ({ filters = {} }) => {
  const { formatMessage } = useIntl();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchNextPageError,
    isFetchingNextPage,
    isPending,
    isPaused,
    refetch
  } = useRecentChangesFeed({ filters });
  const changes = data?.changes ?? [];
  // A failed next page must retry its offset while retaining the loaded rows.
  const handleRetry = isFetchNextPageError ? fetchNextPage : refetch;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: theme => theme.breakpoints.values.lg,
        mr: 'auto'
      }}>
      <RecentChangesList
        changes={changes}
        isLoading={isPending}
        isPaused={isPaused}
        error={error}
        onRetry={handleRetry}
        emptyMessageId={
          Object.keys(filters).length > 0
            ? 'No activity in this scope in the last {days} days'
            : 'No recent activity'
        }
      />
      {changes.length > 0 && hasNextPage && !error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
          <Button
            data-testid="load-more-recent-changes"
            variant="outlined"
            disabled={isFetchingNextPage || isPaused}
            onClick={fetchNextPage}
            startIcon={
              isFetchingNextPage ? <CircularProgress size={16} /> : undefined
            }>
            {formatMessage({ id: 'Load more' })}
          </Button>
        </Box>
      )}
    </Box>
  );
};

RecentChangesFeed.propTypes = {
  filters: RecentChangesFiltersPropTypes
};

export default RecentChangesFeed;
