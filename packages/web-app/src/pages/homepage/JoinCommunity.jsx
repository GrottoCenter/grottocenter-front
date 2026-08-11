import { Box, Button, Grid, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import EmailIcon from '@mui/icons-material/Email';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useIntl } from 'react-intl';
import AppLink from '../../components/common/AppLink';
import { usePermissions } from '../../hooks';

const JoinSection = styled('section')(({ theme }) => ({
  padding: '32px 20px',
  backgroundColor: theme.palette.background.paper,
  textAlign: 'center',
  [theme.breakpoints.down('sm')]: {
    padding: '24px 20px'
  }
}));

const Inner = styled(Box)({
  maxWidth: 960,
  margin: '0 auto'
});

const TitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 8
});

const Subtitle = styled(Typography)({
  maxWidth: 560,
  margin: '0 auto 24px'
});

const BenefitTile = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  padding: '0 4px'
});

const BenefitIcon = styled(Box)(({ theme }) => ({
  width: 56,
  height: 56,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.veryLight || theme.palette.grey[100],
  color: theme.palette.secondary.main,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& svg': { fontSize: 28 },
  [theme.breakpoints.down('sm')]: {
    width: 48,
    height: 48,
    '& svg': { fontSize: 24 }
  }
}));

const AttractiveButton = styled(Button)(({ theme }) => ({
  padding: '14px 40px',
  fontSize: '1rem',
  fontWeight: 700,
  borderRadius: 999,
  textTransform: 'none',
  boxShadow: theme.shadows[3],
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[6]
  }
}));

const BENEFITS = [
  { id: 'Add and edit caves, topos and more', Icon: EditIcon },
  { id: 'Keep track of the caves you have explored', Icon: CheckCircleIcon },
  { id: 'Rate the caves you have visited', Icon: StarIcon },
  { id: 'Message other cavers', Icon: EmailIcon }
];

const JoinCommunity = () => {
  const { formatMessage } = useIntl();
  const { isAuth } = usePermissions();

  if (isAuth) return null;

  return (
    <JoinSection aria-labelledby="join-community-title">
      <Inner>
        <TitleRow>
          <GroupsOutlinedIcon color="secondary" sx={{ fontSize: 28 }} />
          <Typography
            id="join-community-title"
            variant="h3"
            component="h2"
            fontWeight={600}
            color="secondary">
            {formatMessage({ id: 'Join the community' })}
          </Typography>
        </TitleRow>
        <Subtitle variant="body1" color="text.secondary">
          {formatMessage({
            id: 'Create a free account and unlock the full contribution power of Grottocenter.'
          })}
        </Subtitle>
        <Grid
          container
          spacing={{ xs: 2, sm: 3 }}
          sx={{ mb: { xs: 3, sm: 4 } }}>
          {BENEFITS.map(({ id, Icon }) => (
            <Grid key={id} size={{ xs: 6, sm: 3 }}>
              <BenefitTile>
                <BenefitIcon>
                  <Icon />
                </BenefitIcon>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatMessage({ id })}
                </Typography>
              </BenefitTile>
            </Grid>
          ))}
        </Grid>
        <AttractiveButton
          component={AppLink}
          to="/ui/signup"
          variant="contained"
          color="secondary"
          size="large"
          endIcon={<ArrowForwardIcon />}>
          {formatMessage({ id: 'Create an account' })}
        </AttractiveButton>
      </Inner>
    </JoinSection>
  );
};

export default JoinCommunity;
