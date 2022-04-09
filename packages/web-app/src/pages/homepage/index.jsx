import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';

import { displayLoginDialog } from '../../actions/Login';

import Header from './Header';
import Welcome from './Welcome';
import LatestBlogNewsSection from './LatestBlogNewsSection';
import Association from './Association';
import WhatIsIt from './WhatIsIt';
import RandomEntry from './RandomEntry';
import PartnersSection from './PartnersSection';
import Footer from './Footer';

import { usePermissions } from '../../hooks';

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
    <>
      <Header />
      <Welcome />
      <WhatIsIt />
      <RandomEntry />
      <LatestBlogNewsSection />
      <Association />
      <PartnersSection />
      <Footer />
    </>
  );
};

export default HomePage;
