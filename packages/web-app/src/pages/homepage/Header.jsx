import React, { useEffect } from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import {
  GridContainer,
  GridRow,
  GridFullColumn
} from '../../helpers/GridSystem';
import { fseLinks, uisLinks } from '../../conf/externalLinks';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import Translate from '../../components/common/Translate';
import GCLogo from '../../components/common/GCLogo';
import { loadDynamicNumber } from '../../actions/DynamicNumber';

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
  padding: 24px 16px 20px;
  text-align: center;

  @media (min-width: 550px) {
    padding: 40px 40px 32px;
  }
`;

const Sitename = styled('h1')`
  font-weight: 600;
  font-size: 55px;
  line-height: 1.2;
  letter-spacing: -2px;
  margin-bottom: 2px;
`;

const Slogan = styled('span')`
  font-size: 1.5rem;
  font-weight: 400;
`;

const CTARow = styled('div')`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 40px;
`;

const SupporterRow = styled('span')`
  display: flex;
  font-size: small;
  font-weight: 300;
  line-height: 25px;

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
  width: 25px;
  height: 25px;
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

const Header = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadDynamicNumber('entrances'));
  }, [dispatch]);

  return (
    <header className="header">
      <HeaderGridContainer>
        <BrandRow>
          <GridFullColumn>
            <LogoImage />
            <Sitename>Grottocenter</Sitename>
            <Slogan>
              <Translate>The Wiki database made by cavers for cavers</Translate>
            </Slogan>
            <CTARow>
              <Button
                variant="contained"
                color="secondary"
                component="a"
                href="/ui/map">
                <FormattedMessage id="Explore the map" />
              </Button>
              <Button color="primary" component="a" href="/ui/entrances">
                <FormattedMessage id="Find an entrance" />
              </Button>
            </CTARow>
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
};

export default Header;
