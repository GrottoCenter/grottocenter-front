import { Box, Grid, Typography } from '@mui/material';
import {
  CampaignOutlined,
  NatureOutlined,
  FavoriteBorder,
  LockOpenOutlined,
  ShareOutlined
} from '@mui/icons-material';
import BiotechIcon from '@mui/icons-material/Biotech';
import { styled } from '@mui/material/styles';
import { useIntl, FormattedMessage } from 'react-intl';
import GCLogo from '../../components/common/GCLogo';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import AttractiveButton from './AttractiveButton';
import {
  wikicavesLink,
  wikiBBSLinks,
  donateLink,
  karstlinkLinks
} from '../../conf/externalLinks';

const Section = styled('section')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  padding: '32px 24px',
  [theme.breakpoints.down('sm')]: {
    padding: '24px 16px'
  }
}));

const Inner = styled(Box)({
  maxWidth: 900,
  margin: '0 auto'
});

const GoalCard = styled(Box)({
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderRadius: 8,
  padding: '20px 16px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: 8
});

const GOALS = [
  {
    key: 'promote',
    Icon: CampaignOutlined,
    wordId: 'Promote!',
    descId:
      'Promote the development of the speleology in the world especially through web-based collaboration.'
  },
  {
    key: 'share',
    Icon: ShareOutlined,
    wordId: 'Share!',
    descId: 'Share and spread the data related to the speleology'
  },
  {
    key: 'open',
    Icon: LockOpenOutlined,
    wordId: 'Open!',
    descId:
      'Make access to the natural caves data easier especially by using Internet'
  },
  {
    key: 'highlight',
    Icon: NatureOutlined,
    wordId: 'Highlight!',
    descId:
      'Highlight and help the protection of the natural caves and their surroundings'
  },
  {
    key: 'help',
    Icon: BiotechIcon,
    wordId: 'Help!',
    descId: 'Help the exploration and the scientific study of natural caves'
  }
];

const Association = () => {
  const { formatMessage } = useIntl();

  return (
    <Section aria-labelledby="association-title">
      <Inner>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 2,
            flexWrap: 'wrap'
          }}>
          <Box
            sx={{
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 2,
              p: '6px 10px',
              display: 'flex',
              alignItems: 'center',
              '& img': { width: 56, height: 'auto' }
            }}>
            <GCLogo showLink={false} />
          </Box>
          <Typography
            id="association-title"
            variant="h3"
            component="h2"
            fontWeight={600}
            sx={{ color: 'secondary.main' }}>
            {formatMessage({ id: 'Wikicaves association' })}
          </Typography>
        </Box>

        <Typography
          variant="body1"
          sx={{
            color: 'rgba(255,255,255,0.85)',
            textAlign: 'center',
            mb: 3,
            maxWidth: 640,
            mx: 'auto'
          }}>
          <FormattedMessage
            id="The international voluntary association WikiCaves operates the Grottocenter web application WikiCaves has as goals:"
            values={{
              wikicaves: (
                <InternationalizedLink links={wikicavesLink}>
                  <Box
                    component="span"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      '&:hover': { color: 'white' }
                    }}>
                    Wikicaves
                  </Box>
                </InternationalizedLink>
              )
            }}
          />
        </Typography>

        <Grid container spacing={1} sx={{ mb: 3 }}>
          {GOALS.map(({ key, Icon, wordId, descId }) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4 }}>
              <GoalCard>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Icon sx={{ color: 'secondary.main', fontSize: 22 }} />
                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{ color: 'white' }}>
                    {formatMessage({ id: wordId })}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {formatMessage({ id: descId })}
                </Typography>
              </GoalCard>
            </Grid>
          ))}
        </Grid>

        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.55)',
            textAlign: 'center',
            mb: 3,
            maxWidth: 680,
            mx: 'auto',
            '& a': {
              color: 'rgba(255,255,255,0.9)',
              textDecoration: 'underline'
            }
          }}>
          <FormattedMessage
            id="In partnership with the FSE and the UIS, Wikicaves hosts the Speleological Abstracts (BBS/SA) and participates in the Karstlink initiative."
            values={{
              bbs: (
                <InternationalizedLink links={wikiBBSLinks}>
                  BBS/SA
                </InternationalizedLink>
              ),
              karstlink: (
                <InternationalizedLink links={karstlinkLinks}>
                  Karstlink
                </InternationalizedLink>
              )
            }}
          />
        </Typography>

        <Box sx={{ textAlign: 'center' }}>
          <AttractiveButton
            variant="contained"
            color="secondary"
            size="large"
            href={donateLink}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<FavoriteBorder />}
            sx={{ fontWeight: 600, px: 3, textTransform: 'none' }}>
            {formatMessage({ id: 'Donate now' })}
          </AttractiveButton>
        </Box>
      </Inner>
    </Section>
  );
};

export default Association;
