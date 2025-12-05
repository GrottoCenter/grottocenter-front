import React from 'react';
import { styled } from '@mui/material/styles';
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

const FooterWrapper = styled('div')(({ theme }) => ({
  paddingTop: '1rem',
  backgroundColor: theme.palette.primary1Color,
  color: theme.palette.textIconColor,
  textAlign: 'center'
}));

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
