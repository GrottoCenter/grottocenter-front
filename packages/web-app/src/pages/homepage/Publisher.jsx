import React from 'react';
import styled from 'styled-components';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import { wikicavesLink } from '../../conf/externalLinks';
import Translate from '../../components/common/Translate';
import GCLogo from '../../components/common/GCLogo';

const PublisherInfo = styled.div`
  margin-right: 4px;
  display: inline-block;
`;

const PublisherLogo = styled(GCLogo)`
  & > img {
    width: 50px;
    margin-left: 15px;
  }
`;

const PublisherWrapper = styled.div`
  display: inline-block;
  font-size: small;
  margin-top: 10px;
`;
const StyledInternationalizedLink = styled(InternationalizedLink)`
  color: inherit;
`;

const Publisher = () => (
  <PublisherWrapper>
    <PublisherInfo>
      <Translate>Published by</Translate>
    </PublisherInfo>

    <StyledInternationalizedLink links={wikicavesLink}>
      <Translate>Wikicaves association</Translate>
      <PublisherLogo showLink={false} />
    </StyledInternationalizedLink>
  </PublisherWrapper>
);

export default Publisher;
