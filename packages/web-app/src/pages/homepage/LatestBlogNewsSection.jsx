import React from 'react';
import { Box, Typography } from '@mui/material';
import { FeedOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import AppLink from '../../components/common/AppLink';
import LatestBlogNews from '../../containers/LatestBlogNews';
import { frenchRssUrl, englishRssUrl } from '../../conf/apiRoutes';
import { bloggerLinks } from '../../conf/externalLinks';

const Section = styled('section')(({ theme }) => ({
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
  const { locale, formatMessage } = useIntl();
  const isFrench = locale.startsWith('fr');

  return (
    <Section aria-labelledby="news-title">
      <TitleRow>
        <FeedOutlined color="primary" sx={{ fontSize: 28 }} />
        <Typography
          id="news-title"
          variant="h5"
          component="h2"
          fontWeight={600}
          color="primary">
          {formatMessage({ id: 'News' })}
        </Typography>
      </TitleRow>
      <Inner>
        <LatestBlogNews
          key={isFrench ? 'fr' : 'en'}
          blog={isFrench ? 'fr' : 'en'}
          url={isFrench ? frenchRssUrl : englishRssUrl}
        />
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <AppLink href={isFrench ? bloggerLinks.fr : bloggerLinks['*']}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'underline',
                cursor: 'pointer',
                '&:hover': { color: 'text.primary' }
              }}>
              {formatMessage({ id: 'See all news' })}
            </Typography>
          </AppLink>
        </Box>
      </Inner>
    </Section>
  );
};

export default LatestBlogNewsSection;
