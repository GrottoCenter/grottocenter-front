import React from 'react';
import styled from 'styled-components';
import GCLink from '../../components/common/GCLink';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import {
  contactLinks,
  legalLinks,
  contributorsLink,
  wikiLinks
} from '../../conf/externalLinks';
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

const FooterLinks = () => (
  <FooterLinksList>
    <FooterLinksLi>
      <SocialLink as={GCLink} internal href="/ui/faq">
        <Translate>FAQ</Translate>
      </SocialLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialLink as={InternationalizedLink} links={wikiLinks}>
        <Translate>Wiki</Translate>
      </SocialLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialLink as={InternationalizedLink} links={contributorsLink}>
        <Translate>Contributors</Translate>
      </SocialLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialLink as={InternationalizedLink} links={contactLinks}>
        <Translate>Contact</Translate>
      </SocialLink>
    </FooterLinksLi>
    <FooterLinksLi>
      <SocialLink as={InternationalizedLink} links={legalLinks}>
        <Translate>Legal notice</Translate>
      </SocialLink>
    </FooterLinksLi>
  </FooterLinksList>
);

export default FooterLinks;
