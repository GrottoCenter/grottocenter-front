import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import RecentChangesContainer from '../../containers/RecentChangesContainer';
import Translate from '../../components/common/Translate';
import LandingSection from './LandingSection';

const BgRecentChangesSection = withTheme(styled(LandingSection)`
  background-color: ${props => props.theme.palette.primary1Color};
  color: ${props => props.theme.palette.secondaryBlocTitle};
  margin-top: 0;
`);

const SectionTitle = withTheme(styled.h3`
  color: ${props => props.theme.palette.secondaryBlocTitle};
  text-align: center;
  padding-bottom: 10px;
  font-size: 35px;
`);

const RecentChanges = () => (
  <BgRecentChangesSection>
    <SectionTitle>
      <Translate>Recent changes</Translate>
    </SectionTitle>
    <RecentChangesContainer />
  </BgRecentChangesSection>
);

export default RecentChanges;
