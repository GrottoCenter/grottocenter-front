import { Box, Typography } from '@mui/material';
import FeedOutlined from '@mui/icons-material/FeedOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import NewsCard from '@/components/common/card/NewsCard';
import { useLatestBlogNews } from '@/hooks';
import AppLink from '../../components/common/AppLink';
import { frenchRssUrl, englishRssUrl } from '../../conf/apiRoutes';
import { bloggerLinks } from '../../conf/externalLinks';

const Section = styled('section')(({ theme }) => ({
  backgroundColor: theme.palette.primary.veryLight,
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

const LatestBlogNewsSection = () => {
  const { locale, formatMessage } = useIntl();
  const isFrench = locale.startsWith('fr');
  const { data: news, isPending } = useLatestBlogNews(
    isFrench ? frenchRssUrl : englishRssUrl
  );

  return (
    <Section aria-labelledby="news-title" data-testid="blog-news-section">
      <TitleRow>
        <FeedOutlined color="primary" sx={{ fontSize: 28 }} />
        <Typography id="news-title" variant="h3" component="h2" color="primary">
          {formatMessage({ id: 'News' })}
        </Typography>
      </TitleRow>
      <Inner>
        <NewsCard
          key={isFrench ? 'fr' : 'en'}
          showSpinner={isPending}
          day={news?.day}
          month={news?.month}
          title={news?.title}
          text={news?.text}
          image={news?.image}
          linkMore={news?.link}
        />
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <AppLink
            href={isFrench ? bloggerLinks.fr : bloggerLinks['*']}
            variant="body2"
            color="primary"
            underline="hover"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1,
              py: 0.75,
              fontWeight: 'fontWeightMedium'
            }}>
            {formatMessage({ id: 'See all blog news' })}
            <OpenInNewIcon fontSize="inherit" />
          </AppLink>
        </Box>
      </Inner>
    </Section>
  );
};

export default LatestBlogNewsSection;
