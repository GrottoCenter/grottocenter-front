import { useEffect, Suspense, lazy } from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { styled } from '@mui/material/styles';

import { displayLoginDialog } from '../../actions/Login';
import { usePermissions } from '../../hooks';

import Header from './Header';
import HeroStats from './HeroStats';
import Welcome from './Welcome';
import Footer from './Footer';
import FeedbackButton from '../../components/common/FeedbackButton';

const RandomEntry = lazy(() => import('./RandomEntry'));
const RecentChanges = lazy(() => import('./RecentChanges'));
const LatestBlogNewsSection = lazy(() => import('./LatestBlogNewsSection'));
const Association = lazy(() => import('./Association'));
const PartnersSection = lazy(() => import('./PartnersSection'));

const HomepageWrapper = styled('div')(({ theme }) => ({
  fontFamily: theme.typography.fontFamily
}));

const HomePage = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const permissions = usePermissions();

  useEffect(() => {
    if (
      !permissions.isAuth &&
      (location.pathname === '/ui/login' || location.pathname === '/ui/login/')
    ) {
      dispatch(displayLoginDialog());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <HomepageWrapper>
      <Header />
      <Box component="main">
        <HeroStats />
        <Welcome />
        <Suspense fallback={<Box sx={{ minHeight: 200 }} />}>
          <RandomEntry />
          <RecentChanges />
          <LatestBlogNewsSection />
          <Association />
          <PartnersSection />
        </Suspense>
      </Box>
      <Footer />
      <FeedbackButton />
    </HomepageWrapper>
  );
};

export default HomePage;
