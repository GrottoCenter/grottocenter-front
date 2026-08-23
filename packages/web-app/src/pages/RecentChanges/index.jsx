import { useIntl } from 'react-intl';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

import RecentChangesList from '@/components/common/RecentChangesList';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { useRecentChangesFeed } from '@/hooks';

const PAGE_SIZE = 50;

const RecentChangesPage = () => {
  const { formatMessage } = useIntl();
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch
  } = useRecentChangesFeed({ limit: PAGE_SIZE });
  const changes = data?.changes ?? [];
  const handleRetry = changes.length > 0 ? fetchNextPage : refetch;

  return (
    <Layout
      title={formatMessage({ id: 'Recent changes' })}
      subheader={
        <Typography variant="body2" color="text.secondary">
          {formatMessage({
            id: 'Changes from the last 7 days, limited to the latest 500 recorded operations'
          })}
        </Typography>
      }
      content={
        <Box
          sx={{
            width: '100%',
            maxWidth: theme => theme.breakpoints.values.lg,
            mr: 'auto'
          }}>
          <RecentChangesList
            changes={changes}
            isLoading={isPending}
            error={error}
            onRetry={handleRetry}
          />
          {changes.length > 0 && hasNextPage && !error && (
            <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
              <Button
                variant="outlined"
                disabled={isFetchingNextPage}
                onClick={fetchNextPage}
                startIcon={
                  isFetchingNextPage ? (
                    <CircularProgress size={16} />
                  ) : undefined
                }>
                {formatMessage({ id: 'Load more' })}
              </Button>
            </Box>
          )}
        </Box>
      }
    />
  );
};

export default RecentChangesPage;
