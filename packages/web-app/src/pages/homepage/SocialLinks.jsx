import React from 'react';
import { useIntl } from 'react-intl';
import { styled, keyframes } from '@mui/material/styles';
import InternationalizedLink from '../../components/common/InternationalizedLink';
import GCLink from '../../components/common/GCLink';
import {
  bloggerLinks,
  wikiBatsLinks,
  facebookLink,
  githubLink,
  oaiLinks,
  z3950Links,
  uptimeLinks
} from '../../conf/externalLinks';

const SocialLinksList = styled('ul')`
  list-style: none;
  display: inline-block;

  @media (min-width: 550px) {
    margin: 0 5px 0 0;
  }
`;

const SocialLinksListItem = styled('li')`
  display: inline-block;
  width: 40px;
  margin: 0 5px;

  @media (min-width: 550px) {
    margin: 0 5px;
  }
`;

const SocialImage = styled('img')`
  width: 100%;
  padding: 2px;
  border-radius: 10px;
`;

const rotateAnimation = keyframes`
  {
    45% { transform: rotateY(0deg); }
    50% { transform: rotateY(180deg); }
    55% { transform: rotateY(0deg); }
  }
`;

const ApiSocialImage = styled(SocialImage)`
  animation: ${rotateAnimation} 30s ease-out infinite;
`;

const SocialLinks = () => {
  const { formatMessage } = useIntl();

  const facebookText = formatMessage({ id: 'Follow us on Facebook' });
  const blogText = formatMessage({ id: 'Grottocenter blog' });
  const githubText = formatMessage({ id: 'Grottocenter3 on GitHub' });
  const apiText = formatMessage({ id: 'Want to use our API?' });
  const batsText = formatMessage({ id: 'Wiki page for bats' });
  const oaiText = formatMessage({ id: 'OAI-PMH Server' });
  const z3950Text = formatMessage({ id: 'Z39.50 Server' });
  const uptimeText = formatMessage({ id: 'Uptime status page' });

  return (
    <SocialLinksList>
      <SocialLinksListItem>
        <InternationalizedLink links={facebookLink} title={facebookText}>
          <SocialImage
            src="/images/icons8/icons8-facebook-filled-100.png"
            alt={facebookText}
          />
        </InternationalizedLink>
      </SocialLinksListItem>
      <SocialLinksListItem>
        <InternationalizedLink links={bloggerLinks} title={blogText}>
          <SocialImage
            src="/images/icons8/icons8-blogger-filled-100.png"
            alt={blogText}
          />
        </InternationalizedLink>
      </SocialLinksListItem>
      <SocialLinksListItem>
        <InternationalizedLink links={githubLink} title={githubText}>
          <SocialImage
            src="/images/icons8/icons8-github-filled-100.png"
            alt={githubText}
          />
        </InternationalizedLink>
      </SocialLinksListItem>
      <SocialLinksListItem>
        <GCLink internal href="/ui/api" title={apiText}>
          <ApiSocialImage
            src="/images/icons8/icons8-rest-api-filled-100.png"
            alt={apiText}
          />
        </GCLink>
      </SocialLinksListItem>
      <SocialLinksListItem>
        <InternationalizedLink links={wikiBatsLinks} title={batsText}>
          <SocialImage
            src="/images/icons8/bats.svg"
            alt={batsText}
          />
        </InternationalizedLink>
      </SocialLinksListItem>
      <SocialLinksListItem>
        <InternationalizedLink links={oaiLinks} title={oaiText}>
          <SocialImage
            src="/images/icons8/icons8-oai-filled-100.png"
            alt={oaiText}
          />
        </InternationalizedLink>
      </SocialLinksListItem>
      <SocialLinksListItem>
        <InternationalizedLink links={z3950Links} title={z3950Text}>
          <SocialImage
            src="/images/icons8/icons8-z3950-filled-100.png"
            alt={z3950Text}
          />
        </InternationalizedLink>
      </SocialLinksListItem>
      <SocialLinksListItem>
        <InternationalizedLink links={uptimeLinks} title={uptimeText}>
          <SocialImage
            src="/images/icons8/icons8-uptime-filled-100.png"
            alt={uptimeText}
          />
        </InternationalizedLink>
      </SocialLinksListItem>
    </SocialLinksList>
  );
};

export default SocialLinks;
