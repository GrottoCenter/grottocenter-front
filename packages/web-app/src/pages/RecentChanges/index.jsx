import { useIntl } from 'react-intl';
import { Typography } from '@mui/material';
import DifferenceIcon from '@mui/icons-material/Difference';

import RecentChangesFeed from '@/components/appli/RecentChanges/Feed';
import Layout from '@/components/common/Layouts/Fixed/FixedContent';
import { RECENT_CHANGES_MESSAGE_VALUES } from '@/utils/recentChanges';

const RecentChangesPage = () => {
  const { formatMessage } = useIntl();
  return (
    <Layout
      title={formatMessage({ id: 'Activities' })}
      icon={<DifferenceIcon color="secondary" />}
      subheader={
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {formatMessage(
            {
              id: 'Contributions from the last {days} days (limited to the latest {limit} contributions).'
            },
            RECENT_CHANGES_MESSAGE_VALUES
          )}
        </Typography>
      }
      content={<RecentChangesFeed />}
    />
  );
};

export default RecentChangesPage;
