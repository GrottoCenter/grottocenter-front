import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import { useCanPromoteApp } from '../../hooks';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=org.grottocenter.twa';

// Google's officially-hosted "Get it on Google Play" badge. Google publishes
// this asset explicitly for third-party embedding under their branding
// guidelines — don't reproduce or restyle it locally.
const BADGE_URL =
  'https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png';

const Banner = styled('section')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 24,
  padding: '0 10px 20px',
  backgroundColor: theme.palette.primary.veryLight || theme.palette.grey[100],
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: 8,
    padding: '0 20px 10px',
    textAlign: 'center'
  }
}));

const BadgeLink = styled('a')({
  display: 'inline-flex',
  lineHeight: 0,
  '& img': {
    height: 56,
    width: 'auto'
  }
});

const AppPromoBanner = () => {
  const { formatMessage } = useIntl();
  const canPromote = useCanPromoteApp();

  if (!canPromote) return null;

  return (
    <Banner aria-label={formatMessage({ id: 'Grottocenter in your pocket' })}>
      <Box>
        <Typography
          variant="h6"
          component="p"
          sx={{ fontWeight: 600, m: 0, lineHeight: 1.2 }}>
          {formatMessage({ id: 'Grottocenter in your pocket' })}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {formatMessage({
            id: 'Browse caves offline, right in the field.'
          })}
        </Typography>
      </Box>
      <BadgeLink
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={formatMessage({
          id: 'Download Grottocenter on Google Play'
        })}>
        <img
          src={BADGE_URL}
          alt={formatMessage({ id: 'Get it on Google Play' })}
        />
      </BadgeLink>
    </Banner>
  );
};

export default AppPromoBanner;
