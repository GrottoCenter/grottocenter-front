import React, { useEffect } from 'react';
import { Box, Grid, Skeleton, Typography } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import CustomIcon from '../../components/common/CustomIcon';
import AppLink from '../../components/common/AppLink';
import { loadDynamicNumber } from '../../actions/DynamicNumber';

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
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dynamicNumber = useSelector(state => state.dynamicNumber);

  useEffect(() => {
    STATS.forEach(({ key }) => dispatch(loadDynamicNumber(key)));
  }, [dispatch]);

  return (
    <StatsStrip>
      <Grid container justifyContent="center">
        {STATS.map(({ key, iconType, labelId, href, staticValue }) => {
          const stat = dynamicNumber?.[key];
          return (
            <Grid key={key} size={{ xs: 4, md: 2 }}>
              <StatItem
                to={href}
                aria-label={`${stat?.number ? stat.number.toLocaleString() + ' ' : staticValue ? staticValue + ' ' : ''}${formatMessage({ id: labelId })}`}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                  }}>
                  <Box sx={{ '& > span': { margin: 0 } }}>
                    <CustomIcon type={iconType} size={isMobile ? 32 : 48} />
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={theme.palette.primary.main}
                    sx={{
                      mt: 1,
                      [theme.breakpoints.down('sm')]: {
                        fontSize: '1.5rem',
                        mt: '0px'
                      }
                    }}>
                    {staticValue ||
                      (stat?.isFetching ? (
                        <Skeleton variant="text" width={80} />
                      ) : stat?.number ? (
                        stat.number.toLocaleString()
                      ) : (
                        '—'
                      ))}
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
