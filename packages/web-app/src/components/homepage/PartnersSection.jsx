import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import LandingSection from './LandingSection';
import { GridRow, GridFullColumn } from '../../helpers/GridSystem';
import PartnersCarouselContainer from '../../containers/PartnersCarouselContainer';
import Translate from '../common/Translate';

const SectionTitle = withTheme(styled.h3`
  color: ${props => props.theme.palette.accent1Color};
  text-align: center;
  padding-bottom: 20px;
  font-size: 35px;
`);

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
