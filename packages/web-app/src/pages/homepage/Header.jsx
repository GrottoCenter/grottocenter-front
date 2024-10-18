import React from 'react';
import { styled } from '@mui/material/styles';
import {
  GridContainer,
  GridRow,
  GridFullColumn
} from '../../helpers/GridSystem';
import { fseLinks, uisLinks } from '../../conf/externalLinks';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import Translate from '../../components/common/Translate';
import GCLogo from '../../components/common/GCLogo';

const HeaderGridContainer = styled(GridContainer)`
  width: 100% !important;
  max-width: 100% !important;
  padding: 0;
  background: url('/images/caves/topo.jpg') 0 center;
  background-repeat: no-repeat;
  background-size: 220%;
  background-position: top;

  @media (min-width: 550px) {
    background-size: 130%;
  }

  @media (min-width: 1000px) {
    background-size: 100%;
  }
`;

const BrandRow = styled(GridRow)`
  padding: 40px 40px;
  text-align: center;
`;

const Sitename = styled('h1')`
  font-weight: 600;
  font-size: 55px;
  line-height: 1.2;
  letter-spacing: -2px;
`;

const Slogan = styled('span')`
  font-size: large;
  font-weight: 400;
`;

const SupporterRow = styled('span')`
  display: flex;
  font-size: medium;
  font-weight: 300;
  line-height: 40px;

  span {
    display: none;
  }

  @media (min-width: 550px) {
    display: flex;

    span {
      display: flex;
      margin: 0 0 0 10px;
    }
  }
`;

const SupporterLogo = styled('img')`
  width: 40px;
  height: 40px;
  margin: 0 0 0 10px;
`;

const LogoImage = styled(GCLogo)`
  & > img {
    width: 140px;

    @media (min-width: 550px) {
      width: 160px;
    }
  }
`;

const Header = () => (
  <header className="header">
    <HeaderGridContainer>
      <BrandRow>
        <GridFullColumn>
          <LogoImage />
          <Sitename>Grottocenter</Sitename>
          <Slogan>
            <Translate>The Wiki database made by cavers for cavers</Translate>
          </Slogan>
        </GridFullColumn>
      </BrandRow>
      <GridRow>
        <GridFullColumn>
          <SupporterRow>
            <InternationalizedLink links={fseLinks}>
              <SupporterLogo src="/images/FSE.svg" alt="Logo FSE" />
            </InternationalizedLink>
            <InternationalizedLink links={uisLinks}>
              <SupporterLogo src="/images/UIS.svg" alt="Logo UIS" />
            </InternationalizedLink>
            <span>
              <Translate>
                Grottocenter is supported by the FSE and the UIS
              </Translate>
            </span>
          </SupporterRow>
        </GridFullColumn>
      </GridRow>
    </HeaderGridContainer>
  </header>
);

export default Header;
