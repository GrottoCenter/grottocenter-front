import React from 'react';
import styled from 'styled-components';
import { Typography } from '@mui/material';
import { useIntl } from 'react-intl';
import InternationalizedLink from '../InternationalizedLink';
import { licenceLinks, licensesODBLink } from '../../../conf/externalLinks';
import GCLogo from '../GCLogo';

const LogoFooter = styled(GCLogo)`
  & > img {
    height: 30px;
    padding-left: 10px;
    padding-right: 10px;
  }
`;

const LicenceImage = styled.img`
  width: 75px;
`;

const Container = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const Spaced = styled.div`
  margin-left: 10%;
  text-align: center;
`;

const AlignText = styled.div`
  padding-top: 10px;
  text-align: center;
`;

const Footer = () => {
  const { formatMessage } = useIntl();
  return (
    <Container>
      <AlignText>
        <LogoFooter />
        <Typography variant="caption"> v23.0.0 </Typography>
      </AlignText>
      <Spaced>
        <InternationalizedLink links={licensesODBLink}>
          <LicenceImage
            src="/images/odbl.png"
            alt="ODBL license"
            title={formatMessage({
              id: 'The ODBL license applies to all data that is not copyrighted.'
            })}
          />
        </InternationalizedLink>
        <InternationalizedLink links={licenceLinks}>
          <LicenceImage
            src="/images/CC-BY-SA.png"
            alt="CC-BY-SA licence"
            title={formatMessage({
              id: 'Unless stated otherwise, the CC-BY-SA license applies for documents and texts subject to copyright.'
            })}
          />
        </InternationalizedLink>
      </Spaced>
    </Container>
  );
};

export default Footer;
