import React from 'react';
import { styled } from '@mui/material/styles';
import RecentChangesContainer from '../../containers/RecentChangesContainer';
import Translate from '../../components/common/Translate';
import LandingSection from './LandingSection';

const BgRecentChangesSection = styled(LandingSection)(({ theme }) => ({
  backgroundColor: theme.palette.primary1Color,
  color: theme.palette.secondaryBlocTitle,
  marginTop: 0,
  fontSize: '1.5rem'
}));

const SectionTitle = styled('h3')(({ theme }) => ({
  color: theme.palette.secondaryBlocTitle,
  textAlign: 'center',
  paddingBottom: '10px',
  fontSize: '35px'
}));

const RecentChanges = () => (
  <BgRecentChangesSection>
    <SectionTitle>
      <Translate>Recent changes</Translate>
    </SectionTitle>
    <RecentChangesContainer />
  </BgRecentChangesSection>
);

export default RecentChanges;
