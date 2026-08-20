import { Box, Grid, Skeleton, Typography, useMediaQuery } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useQueries } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import CustomIcon from '../../components/common/CustomIcon';
import AppLink from '../../components/common/AppLink';
import { dynamicNumbersUrl } from '../../conf/apiRoutes';
import { apiGet } from '../../api/client';
import { statsKeys } from '../../api/queryKeys';
import { STALE } from '../../conf/queryClient';

const StatsStrip = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.veryLight,
  padding: '24px 0',
  [theme.breakpoints.down('sm')]: {
    padding: '16px 0'
  }
}));

const StatItem = styled(AppLink)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  textAlign: 'center',
  margin: '0 8px',
  color: 'inherit',
  textDecoration: 'none',
  borderRadius: 8,
  padding: '4px 8px',
  transition: 'background-color 0.15s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const STATS = [
  {
    key: 'entrances',
    iconType: 'entrance',
    labelId: 'entrances',
    href: '/ui/entrances'
  },
  {
    key: 'massifs',
    iconType: 'massif',
    labelId: 'massifs',
    href: '/ui/massifs'
  },
  { key: 'users', iconType: 'caver', labelId: 'cavers', href: '/ui/persons' },
  {
    key: 'countries',
    iconType: 'country',
    labelId: 'countries',
    href: '/ui/countries'
  },
  {
    key: 'documents',
    iconType: 'bibliography',
    labelId: 'documents',
    href: '/ui/documents'
  },
  {
    key: 'organizations',
    iconType: 'organization',
    labelId: 'organizations',
    href: '/ui/organizations'
  }
];

const HeroStats = () => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // useQueries: one query per stat, all fire in parallel. Same cache key /
  // queryFn shape as useDynamicNumber so the homepage cards and this strip
  // share cache entries.
  const queries = useQueries({
    queries: STATS.map(({ key }) => ({
      queryKey: statsKeys.dynamicNumber(key),
      queryFn: async () => {
        const data = await apiGet(dynamicNumbersUrl[key]);
        return data?.count ?? null;
      },
      staleTime: STALE.STANDARD
    }))
  });

  return (
    <StatsStrip>
      <Grid container justifyContent="center">
        {STATS.map(({ key, iconType, labelId, href, staticValue }, idx) => {
          const stat = queries[idx];
          const number = stat?.data;
          let statPrefix = '';
          if (number) statPrefix = `${number.toLocaleString()} `;
          else if (staticValue) statPrefix = `${staticValue} `;
          let statValue = staticValue;
          if (!statValue) {
            if (stat?.isPending) {
              statValue = <Skeleton variant="text" width={80} />;
            } else statValue = number ? number.toLocaleString() : '—';
          }
          return (
            <Grid key={key} size={{ xs: 4, md: 2 }}>
              <StatItem
                to={href}
                aria-label={`${statPrefix}${formatMessage({ id: labelId })}`}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                  <Box sx={{ '& > span': { margin: 0.25 } }}>
                    <CustomIcon type={iconType} size={isMobile ? 32 : 48} />
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={theme.palette.primary.main}
                    sx={{
                      mt: 0.5,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: '0.9375rem',
                        mt: '0px'
                      }
                    }}>
                    {statValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatMessage({ id: labelId })}
                  </Typography>
                </Box>
              </StatItem>
            </Grid>
          );
        })}
      </Grid>
    </StatsStrip>
  );
};

export default HeroStats;
