import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import LandingSection from './LandingSection';
import { GridRow, GridOneHalfColumn } from '../../helpers/GridSystem';
import Translate from '../../components/common/Translate';
import LatestBlogNews from '../../containers/LatestBlogNews';
import { frenchRssUrl, englishRssUrl } from '../../conf/apiRoutes';

const SectionTitle = withTheme(styled.h3`
  color: ${props => props.theme.palette.accent1Color};
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;
`);

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
