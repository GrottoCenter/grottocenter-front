import React from 'react';
import { styled } from '@mui/material/styles';
import RandomEntryCardContainer from '../../containers/RandomEntryCardContainer';
import { GridRow } from '../../helpers/GridSystem';
import Translate from '../../components/common/Translate';
import LandingSection from './LandingSection';

const RandomEntrySection = styled(LandingSection)`
  text-align: center;
`;

const BgRandomEntrySection = styled(RandomEntrySection)`
  background-image: url('/images/caves/gours.jpg');
  background-size: cover;
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  margin-top: 0;
`;

const SectionTitle = styled('h3')(({ theme }) => ({
  color: theme.palette.secondaryBlocTitle,
  textAlign: 'center',
  paddingBottom: '50px',
  fontSize: '35px'
}));

const RandomEntry = () => (
  <BgRandomEntrySection>
    <GridRow>
      <SectionTitle>
        <Translate>A cave on Grottocenter</Translate>
      </SectionTitle>
    </GridRow>
    <GridRow>
      <RandomEntryCardContainer />
    </GridRow>
  </BgRandomEntrySection>
);

export default RandomEntry;
