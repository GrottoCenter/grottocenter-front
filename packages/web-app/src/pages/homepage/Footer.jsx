import React from 'react';
import withTheme from '@mui/styles/withTheme';
import styled from 'styled-components';
import Divider from '@mui/material/Divider';
import DonateForm from './DonateForm';
import FooterDisclamer from '../../components/common/FooterDisclamer';
import Publisher from './Publisher';
import SocialLinks from './SocialLinks';
import FooterLinks from './FooterLinks';
import {
  GridContainer,
  GridRow,
  GridOneHalfColumn
} from '../../helpers/GridSystem';

const FooterWrapper = withTheme(styled.div`
  background-color: ${props => props.theme.palette.primary1Color};
  color: ${props => props.theme.palette.textIconColor};
  text-align: center;
`);

const Footer = () => (
  <div>
    <FooterWrapper>
      <GridContainer>
        <GridRow>
          <GridOneHalfColumn>
            <Publisher />
          </GridOneHalfColumn>

          <GridOneHalfColumn>
            <DonateForm />
          </GridOneHalfColumn>
        </GridRow>

        <Divider />

        <GridRow>
          <GridOneHalfColumn>
            <FooterLinks />
          </GridOneHalfColumn>

          <GridOneHalfColumn>
            <SocialLinks />
          </GridOneHalfColumn>
        </GridRow>
      </GridContainer>
    </FooterWrapper>

    <FooterDisclamer />
  </div>
);

export default Footer;
