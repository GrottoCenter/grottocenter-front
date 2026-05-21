import React from 'react';
import { Box, Typography } from '@mui/material';
import { FeedOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useIntl, FormattedMessage } from 'react-intl';
import GCLink from '../../components/common/GCLink';
import LatestBlogNews from '../../containers/LatestBlogNews';
import { frenchRssUrl, englishRssUrl } from '../../conf/apiRoutes';

const FRENCH_BLOG_URL = 'https://blog-fr.grottocenter.org/';
const ENGLISH_BLOG_URL = 'https://blog-en.grottocenter.org/';

const Section = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.veryLight,
  padding: '32px 24px',
  [theme.breakpoints.down('sm')]: {
    padding: '24px 16px'
  }
}));

const TitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginBottom: 20
});

const Inner = styled(Box)({
  maxWidth: 720,
  margin: '0 auto'
});

const LatestBlogNewsSection = () => {
  const { locale } = useIntl();
  const isFrench = locale.startsWith('fr');

  return (
    <Section>
      <TitleRow>
        <FeedOutlined color="primary" sx={{ fontSize: 28 }} />
        <Typography variant="h5" fontWeight={600} color="primary">
          <FormattedMessage id="News" />
        </Typography>
      </TitleRow>
      <Inner>
        <LatestBlogNews
          blog={isFrench ? 'fr' : 'en'}
          url={isFrench ? frenchRssUrl : englishRssUrl}
        />
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <GCLink href={isFrench ? FRENCH_BLOG_URL : ENGLISH_BLOG_URL}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'underline',
                cursor: 'pointer',
                '&:hover': { color: 'text.primary' }
              }}>
              <FormattedMessage id="See all news" />
            </Typography>
          </GCLink>
        </Box>
      </Inner>
    </Section>
  );
};

export default LatestBlogNewsSection;
