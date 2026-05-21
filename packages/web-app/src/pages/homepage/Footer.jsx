import React from 'react';
import { Box, Grid, Typography } from '@mui/material';
import { keyframes, styled } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import GCLogo from '../../components/common/GCLogo';
import GCLink from '../../components/common/GCLink';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import {
  wikicavesLink,
  wikiLinks,
  contributorsLink,
  contactLinks,
  legalLinks,
  licenceLinks,
  licensesODBLink,
  bloggerLinks,
  wikiBatsLinks,
  facebookLink,
  githubLink,
  oaiLinks,
  z3950Links,
  uptimeLinks
} from '../../conf/externalLinks';

const FooterRoot = styled('footer')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: 'rgba(255,255,255,0.7)'
}));

const MainSection = styled(Box)({
  maxWidth: 1080,
  margin: '0 auto',
  padding: '40px 24px 32px'
});

const ColumnLabel = styled(Typography)({
  color: 'rgba(255,255,255,0.4)',
  letterSpacing: '0.1em',
  marginBottom: 12,
  display: 'block'
});

const NavList = styled(Box)(({ theme }) => ({
  '& a, & a:visited': {
    color: 'rgba(255,255,255,0.75)',
    textDecoration: 'none',
    fontSize: '1.3rem',
    fontWeight: 400,
    display: 'block',
    marginBottom: 10,
    '&:hover': { color: theme.palette.secondary.main }
  }
}));

const LicenseBadge = styled('img')({
  width: 72,
  backgroundColor: 'rgba(255,255,255,0.88)',
  borderRadius: 4,
  padding: '2px 4px',
  display: 'block',
  flexShrink: 0
});

const LicenseBar = styled(Box)({
  borderTop: '1px solid rgba(255,255,255,0.1)',
  padding: '14px 24px',
  maxWidth: 1080,
  margin: '0 auto',
  boxSizing: 'border-box'
});

const LicenseLine = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  marginBottom: 6,
  flexWrap: 'wrap'
});

const IconItem = styled('li')({
  display: 'inline-block',
  width: 38,
  margin: '0 4px 4px 0'
});

const IconList = styled('ul')({
  listStyle: 'none',
  padding: 0,
  margin: 0
});

const SocialImg = styled('img')({
  width: '100%',
  padding: 2,
  borderRadius: 10,
  display: 'block'
});

const rotateAnimation = keyframes`
  45% { transform: rotateY(0deg); }
  50% { transform: rotateY(180deg); }
  55% { transform: rotateY(0deg); }
`;

const ApiImg = styled(SocialImg)({
  animation: `${rotateAnimation} 30s ease-out infinite`
});

const Footer = () => {
  const { formatMessage } = useIntl();

  return (
    <FooterRoot>
      <MainSection>
        <Grid container spacing={4}>
          {/* Column 1 — Brand + Licenses */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
              <Box
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.92)',
                  borderRadius: 1.5,
                  p: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  '& img': { width: 40, height: 'auto' }
                }}>
                <GCLogo showLink={false} />
              </Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                Grottocenter
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, mb: 1.5 }}>
              {formatMessage({ id: 'Published by' })}{' '}
              <InternationalizedLink links={wikicavesLink}>
                <Box
                  component="span"
                  sx={{
                    color: 'rgba(255,255,255,0.75)',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': { color: 'white' }
                  }}>
                  {formatMessage({ id: 'Wikicaves association' })}
                </Box>
              </InternationalizedLink>
            </Typography>
          </Grid>

          {/* Column 2 — Navigation */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <ColumnLabel variant="overline">
              {formatMessage({ id: 'Navigation' })}
            </ColumnLabel>
            <NavList
              component="nav"
              aria-label={formatMessage({ id: 'Navigation' })}>
              <GCLink internal href="/ui/faq">
                {formatMessage({ id: 'FAQ' })}
              </GCLink>
              <InternationalizedLink links={wikiLinks}>
                {formatMessage({ id: 'Wiki' })}
              </InternationalizedLink>
              <InternationalizedLink links={contributorsLink}>
                {formatMessage({ id: 'Contributors' })}
              </InternationalizedLink>
              <InternationalizedLink links={contactLinks}>
                {formatMessage({ id: 'Contact' })}
              </InternationalizedLink>
              <InternationalizedLink links={legalLinks}>
                {formatMessage({ id: 'Legal notice' })}
              </InternationalizedLink>
            </NavList>
          </Grid>

          {/* Column 3 — Follow us */}
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <ColumnLabel variant="overline">
              {formatMessage({ id: 'Follow us' })}
            </ColumnLabel>
            <IconList>
              <IconItem>
                <InternationalizedLink
                  links={facebookLink}
                  title={formatMessage({ id: 'Follow us on Facebook' })}>
                  <SocialImg
                    src="/images/icons8/icons8-facebook-filled-100.png"
                    alt={formatMessage({ id: 'Follow us on Facebook' })}
                  />
                </InternationalizedLink>
              </IconItem>
              <IconItem>
                <InternationalizedLink
                  links={bloggerLinks}
                  title={formatMessage({ id: 'Grottocenter blog' })}>
                  <SocialImg
                    src="/images/icons8/icons8-blogger-filled-100.png"
                    alt={formatMessage({ id: 'Grottocenter blog' })}
                  />
                </InternationalizedLink>
              </IconItem>
            </IconList>
          </Grid>

          {/* Column 4 — Technical */}
          <Grid size={{ xs: 6, sm: 6, md: 3 }}>
            <ColumnLabel variant="overline">
              {formatMessage({ id: 'Technical' })}
            </ColumnLabel>
            <IconList>
              <IconItem>
                <InternationalizedLink
                  links={githubLink}
                  title={formatMessage({ id: 'Grottocenter3 on GitHub' })}>
                  <SocialImg
                    src="/images/icons8/icons8-github-filled-100.png"
                    alt={formatMessage({ id: 'Grottocenter3 on GitHub' })}
                  />
                </InternationalizedLink>
              </IconItem>
              <IconItem>
                <GCLink
                  internal
                  href="/ui/api"
                  title={formatMessage({ id: 'Want to use our API?' })}>
                  <ApiImg
                    src="/images/icons8/icons8-rest-api-filled-100.png"
                    alt={formatMessage({ id: 'Want to use our API?' })}
                  />
                </GCLink>
              </IconItem>
              <IconItem>
                <InternationalizedLink
                  links={oaiLinks}
                  title={formatMessage({ id: 'OAI-PMH Server' })}>
                  <SocialImg
                    src="/images/icons8/icons8-oai-filled-100.png"
                    alt={formatMessage({ id: 'OAI-PMH Server' })}
                  />
                </InternationalizedLink>
              </IconItem>
              <IconItem>
                <InternationalizedLink
                  links={z3950Links}
                  title={formatMessage({ id: 'Z39.50 Server' })}>
                  <SocialImg
                    src="/images/icons8/icons8-z3950-filled-100.png"
                    alt={formatMessage({ id: 'Z39.50 Server' })}
                  />
                </InternationalizedLink>
              </IconItem>
              <IconItem>
                <InternationalizedLink
                  links={uptimeLinks}
                  title={formatMessage({ id: 'Uptime status page' })}>
                  <SocialImg
                    src="/images/icons8/icons8-uptime-filled-100.png"
                    alt={formatMessage({ id: 'Uptime status page' })}
                  />
                </InternationalizedLink>
              </IconItem>
              <IconItem>
                <InternationalizedLink
                  links={wikiBatsLinks}
                  title={formatMessage({ id: 'Wiki page for bats' })}>
                  <SocialImg
                    src="/images/icons8/bats.svg"
                    alt={formatMessage({ id: 'Wiki page for bats' })}
                  />
                </InternationalizedLink>
              </IconItem>
            </IconList>
          </Grid>
        </Grid>
      </MainSection>

      <LicenseBar>
        <LicenseLine>
          <InternationalizedLink links={licenceLinks}>
            <LicenseBadge src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
          </InternationalizedLink>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.45)', minWidth: 0 }}>
            {formatMessage({
              id: 'Unless stated otherwise, the CC-BY-SA license applies for documents and texts subject to copyright.'
            })}
          </Typography>
        </LicenseLine>
        <LicenseLine sx={{ mb: 0 }}>
          <InternationalizedLink links={licensesODBLink}>
            <LicenseBadge src="/images/odbl.png" alt="ODbL licence" />
          </InternationalizedLink>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.45)', minWidth: 0 }}>
            {formatMessage({
              id: 'The ODBL license applies to all data that is not copyrighted.'
            })}
          </Typography>
        </LicenseLine>
      </LicenseBar>
    </FooterRoot>
  );
};

export default Footer;
