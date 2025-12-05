import React from 'react';
import { styled } from '@mui/material/styles';
import LandingSection from './LandingSection';
import { GridRow, GridOneHalfColumn } from '../../helpers/GridSystem';
import Translate from '../../components/common/Translate';
import LatestBlogNews from '../../containers/LatestBlogNews';
import { frenchRssUrl, englishRssUrl } from '../../conf/apiRoutes';

const SectionTitle = styled('h3')(({ theme }) => ({
  color: theme.palette.accent1Color,
  textAlign: 'center',
  paddingBottom: '50px',
  fontSize: '35px'
}));

const LatestBlogNewsSection = () => (
  <LandingSection>
    <GridRow>
      <SectionTitle>
        <Translate>News</Translate>
      </SectionTitle>
    </GridRow>
    <GridRow>
      <GridOneHalfColumn>
        <LatestBlogNews blog="fr" url={frenchRssUrl} />
      </GridOneHalfColumn>
      <GridOneHalfColumn>
        <LatestBlogNews blog="en" url={englishRssUrl} />
      </GridOneHalfColumn>
    </GridRow>
  </LandingSection>
);

export default LatestBlogNewsSection;
