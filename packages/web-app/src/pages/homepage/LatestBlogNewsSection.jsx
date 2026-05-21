import React from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useIntl, FormattedMessage } from 'react-intl';
import LandingSection from './LandingSection';
import Translate from '../../components/common/Translate';
import LatestBlogNews from '../../containers/LatestBlogNews';
import { frenchRssUrl, englishRssUrl } from '../../conf/apiRoutes';

const FRENCH_BLOG_URL = 'https://blog-fr.grottocenter.org/';
const ENGLISH_BLOG_URL = 'https://blog-en.grottocenter.org/';

const SectionTitle = styled('h3')(({ theme }) => ({
  color: theme.palette.accent1Color,
  textAlign: 'center',
  paddingBottom: '0px',
  fontSize: '35px'
}));

const LatestBlogNewsSection = () => {
  const { locale } = useIntl();
  const isFrench = locale.startsWith('fr');

  return (
    <LandingSection>
      <SectionTitle>
        <Translate>News</Translate>
      </SectionTitle>
      <Box
        sx={{
          maxWidth: 720,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 0 }
        }}>
        <LatestBlogNews
          blog={isFrench ? 'fr' : 'en'}
          url={isFrench ? frenchRssUrl : englishRssUrl}
        />
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button
            variant="outlined"
            color="secondary"
            href={isFrench ? FRENCH_BLOG_URL : ENGLISH_BLOG_URL}
            target="_blank"
            rel="noopener noreferrer">
            <FormattedMessage id="See all news" />
          </Button>
        </Box>
      </Box>
    </LandingSection>
  );
};

export default LatestBlogNewsSection;
