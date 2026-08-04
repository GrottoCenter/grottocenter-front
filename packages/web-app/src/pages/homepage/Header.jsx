import React from 'react';
import { Box, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import MapIcon from '@mui/icons-material/Map';
import SearchIcon from '@mui/icons-material/Search';
import { useIntl } from 'react-intl';
import { fseLinks, uisLinks } from '../../conf/externalLinks';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import GCLogo from '../../components/common/GCLogo';

const HeaderRoot = styled(Box)({
  width: '100%',
  background: "url('/images/caves/topo.jpg') center top no-repeat",
  backgroundSize: '220%',
  '@media (min-width: 550px)': { backgroundSize: '130%' },
  '@media (min-width: 1000px)': { backgroundSize: '100%' }
});

const BrandRow = styled(Box)(({ theme }) => ({
  padding: '24px 16px 20px',
  textAlign: 'center',
  [theme.breakpoints.up('sm')]: { padding: '40px 40px 32px' }
}));

const Sitename = styled('h1')({
  fontWeight: 600,
  fontSize: 'clamp(1.25rem, 10vw, 55px)',
  lineHeight: 1.2,
  letterSpacing: -2,
  // Explicit since the global Skeleton-CSS `h1..h6 { margin-top: 0 }` is gone;
  // the UA default (0.67em) would otherwise push the brand row down.
  marginTop: 0,
  marginBottom: 2
});

const Slogan = styled('span')({
  fontSize: '0.9375rem',
  fontWeight: 400
});

const CTARow = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: 8,
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: 40,
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16
  },
  '& > .MuiButton-root': {
    minWidth: 220
  }
}));

const SupporterRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  fontSize: 'small',
  fontWeight: 300,
  lineHeight: '25px',
  gap: 10,
  padding: '0 16px 12px',
  '& span': { display: 'none' },
  [theme.breakpoints.up('sm')]: {
    '& span': { display: 'flex' }
  }
}));

const SupporterLogo = styled('img')({
  width: 25,
  height: 25
});

const LogoImage = styled(GCLogo)({
  '& > img': { width: 140 },
  '@media (min-width: 550px)': { '& > img': { width: 160 } }
});

const Header = () => {
  const { formatMessage } = useIntl();

  return (
    <Box component="header">
      <HeaderRoot>
        <BrandRow>
          <LogoImage />
          <Sitename>Grottocenter</Sitename>
          <Slogan>
            {formatMessage({
              id: 'The Wiki database made by cavers for cavers'
            })}
          </Slogan>
          <CTARow>
            <Button
              variant="contained"
              color="secondary"
              component="a"
              href="/ui/map"
              startIcon={<MapIcon />}
              sx={{ fontWeight: 600 }}>
              {formatMessage({ id: 'Explore the map' })}
            </Button>
            <Button
              color="primary"
              component="a"
              href="/ui/entrances"
              startIcon={<SearchIcon />}
              sx={{ fontWeight: 600 }}>
              {formatMessage({ id: 'Find an entrance' })}
            </Button>
          </CTARow>
        </BrandRow>

        <SupporterRow>
          <InternationalizedLink links={fseLinks}>
            <SupporterLogo src="/images/FSE.svg" alt="Logo FSE" />
          </InternationalizedLink>
          <InternationalizedLink links={uisLinks}>
            <SupporterLogo src="/images/UIS.svg" alt="Logo UIS" />
          </InternationalizedLink>
          <span>
            {formatMessage({
              id: 'Grottocenter is supported by the FSE and the UIS'
            })}
          </span>
        </SupporterRow>
      </HeaderRoot>
    </Box>
  );
};

export default Header;
