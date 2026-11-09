import { Box } from '@mui/material';
import { useIntl } from 'react-intl';

import AppLink from '@/components/common/AppLink';
import RecentChangesList from '@/components/common/RecentChangesList';
import { useRecentChanges } from '@/hooks';

const RecentChangesPreview = () => {
  const { formatMessage } = useIntl();
  const {
    data: changes = [],
    error,
    isPending,
    isPaused,
    refetch
  } = useRecentChanges();

  return (
    <>
      <RecentChangesList
        changes={changes}
        isLoading={isPending}
        isPaused={isPaused}
        error={error}
        onRetry={refetch}
      />
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        <AppLink
          to="/ui/changes/recent"
          data-testid="see-all-recent-changes"
          variant="body2"
          color="text.secondary"
          sx={{ '&:hover': { color: 'text.primary' } }}>
          {formatMessage({ id: 'See all activities' })}
        </AppLink>
      </Box>
    </>
  );
};

export default RecentChangesPreview;
