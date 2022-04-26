import React from 'react';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import GCLink from '../../components/common/GCLink';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import {
  contactLinks,
  legalLinks,
  contributorsLink,
  userguideLinks
} from '../../conf/Config';
import Translate from '../../components/common/Translate';

const FooterLinksList = styled.ul`
  list-style: none;
  font-size: large;
`;

const FooterLinksLi = styled.li`
  display: inline-block;
  margin-right: 15px;
`;

const SocialLink = styled.div`
  text-decoration: none;
  font-size: medium;
  color: ${props => props.theme.palette.textIconColor};

  :hover {
    color: ${props => props.theme.palette.accent1Color};
  }
`;

const SocialGCLink = withTheme(SocialLink.withComponent(GCLink));

const SocialIntlLink = withTheme(
  SocialLink.withComponent(InternationalizedLink)
);

const FooterLinks = () => (
  <FooterLinksList>
    <FooterLinksLi>
      <SocialGCLink internal href="/ui/faq">
        <Translate>FAQ</Translate>
      </SocialGCLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialIntlLink links={userguideLinks}>
        <Translate>User guide</Translate>
      </SocialIntlLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialIntlLink links={contributorsLink}>
        <Translate>Contributors</Translate>
      </SocialIntlLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialIntlLink links={contactLinks}>
        <Translate>Contact</Translate>
      </SocialIntlLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialIntlLink links={legalLinks}>
        <Translate>Legal notice</Translate>
      </SocialIntlLink>
    </FooterLinksLi>
  </FooterLinksList>
);

export default FooterLinks;
