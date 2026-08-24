import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { useIntl } from 'react-intl';

import AppLink from '@/components/common/AppLink';
import RecentChangesList from '@/components/common/RecentChangesList';
import { useRecentChanges } from '@/hooks';

const HOMEPAGE_CHANGES_LIMIT = 10;

const Section = styled('section')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  padding: theme.spacing(4, 3),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3, 2)
  }
}));

const TitleRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2.5)
}));

const Inner = styled(Box)({
  maxWidth: 720,
  margin: '0 auto'
});

const RecentChanges = () => {
  const { formatMessage } = useIntl();
  const {
    data: changes = [],
    error,
    isPending,
    refetch
  } = useRecentChanges({ limit: HOMEPAGE_CHANGES_LIMIT });

  return (
    <Section aria-labelledby="recent-changes-title">
      <TitleRow>
        <HistoryOutlinedIcon
          color="primary"
          sx={{ fontSize: theme => theme.spacing(3.5) }}
        />
        <Typography
          id="recent-changes-title"
          variant="h3"
          component="h2"
          fontWeight={600}
          color="primary">
          {formatMessage({ id: 'Recent changes' })}
        </Typography>
      </TitleRow>
      <Inner>
        <RecentChangesList
          changes={changes}
          isLoading={isPending}
          error={error}
          onRetry={refetch}
        />
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <AppLink
            to="/ui/changes/recent"
            variant="body2"
            color="text.secondary"
            sx={{ '&:hover': { color: 'text.primary' } }}>
            {formatMessage({ id: 'See all recent changes' })}
          </AppLink>
        </Box>
      </Inner>
    </Section>
  );
};

export default RecentChanges;
