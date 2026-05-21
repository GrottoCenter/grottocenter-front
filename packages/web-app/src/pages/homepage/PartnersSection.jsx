import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Skeleton, Typography } from '@mui/material';
import { Handshake } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import LandingSection from './LandingSection';
import { GridRow, GridFullColumn } from '../../helpers/GridSystem';
import PartnersCarouselContainer from '../../containers/PartnersCarouselContainer';
import Translate from '../../components/common/Translate';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import { fseLinks, uisLinks } from '../../conf/externalLinks';
import { loadDynamicNumber } from '../../actions/DynamicNumber';

const TitleRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  paddingBottom: '4px'
});

const SectionTitle = styled('h3')(({ theme }) => ({
  color: theme.palette.accent1Color,
  margin: 0,
  fontSize: '35px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  '@media (max-width: 550px)': {
    fontSize: '24px'
  }
}));

const StyledHandshake = styled(Handshake)(({ theme }) => ({
  color: theme.palette.accent1Color,
  fontSize: '1em'
}));

const SupporterRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 16
});

const SupporterLogo = styled('img')({
  width: 30,
  height: 30
});

const Description = styled(Typography)({
  textAlign: 'center',
  maxWidth: 560,
  margin: '0 auto 24px',
  padding: '0 16px'
});

const PartnersSection = () => {
  const dispatch = useDispatch();
  const officialPartners = useSelector(
    state => state.dynamicNumber?.officialPartners
  );

  useEffect(() => {
    dispatch(loadDynamicNumber('officialPartners'));
  }, [dispatch]);

  return (
    <LandingSection>
      <GridRow>
        <TitleRow>
          <SectionTitle>
            <StyledHandshake />
            {officialPartners?.isFetching ? (
              <Skeleton variant="text" width={40} />
            ) : (
              officialPartners?.number &&
              `${officialPartners.number.toLocaleString()} `
            )}
            <Translate>partners</Translate>
          </SectionTitle>
        </TitleRow>
        <Description variant="body2" color="text.secondary">
          <Translate>
            take part in the project by funding, providing data, communicating
            on the interest and benefits of cavers to share data.
          </Translate>
        </Description>
      </GridRow>
      <GridRow>
        <GridFullColumn>
          <PartnersCarouselContainer />
          <SupporterRow>
            <InternationalizedLink links={fseLinks}>
              <SupporterLogo src="/images/FSE.svg" alt="Logo FSE" />
            </InternationalizedLink>
            <InternationalizedLink links={uisLinks}>
              <SupporterLogo src="/images/UIS.svg" alt="Logo UIS" />
            </InternationalizedLink>
            <Typography variant="body2" color="text.secondary">
              <Translate>
                Grottocenter is supported by the FSE and the UIS
              </Translate>
            </Typography>
          </SupporterRow>
        </GridFullColumn>
      </GridRow>
    </LandingSection>
  );
};

export default PartnersSection;
