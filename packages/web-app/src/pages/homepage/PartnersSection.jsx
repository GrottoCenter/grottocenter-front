import React from 'react';
import { styled } from '@mui/material/styles';
import LandingSection from './LandingSection';
import { GridRow, GridFullColumn } from '../../helpers/GridSystem';
import PartnersCarouselContainer from '../../containers/PartnersCarouselContainer';
import Translate from '../../components/common/Translate';

const SectionTitle = styled('h3')(({ theme }) => ({
  color: theme.palette.accent1Color,
  textAlign: 'center',
  paddingBottom: '20px',
  fontSize: '35px'
}));

const PartnersSection = () => (
  <LandingSection>
    <GridRow>
      <SectionTitle>
        <Translate>Partners</Translate>
      </SectionTitle>
    </GridRow>
    <GridRow>
      <GridFullColumn>
        <PartnersCarouselContainer />
      </GridFullColumn>
    </GridRow>
  </LandingSection>
);

export default PartnersSection;
