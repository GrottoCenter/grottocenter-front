import React from 'react';
import Toolbar from '@mui/material/Toolbar';
import { styled } from '@mui/material/styles';
import InternationalizedLink from '../common/InternationalizedLink';
import GCLink from '../common/GCLink';
import GCLogo from '../common/GCLogo';
import {
  licenceLinks,
  fseLinks,
  contactLinks,
  githubLink,
  facebookLink,
  twitterLink,
  bloggerLinks
} from '../../conf/externalLinks';

const FooterBar = styled(Toolbar)(({ theme }) => ({
  color: theme.palette.fullBlack,
  backgroundColor: theme.palette.primary3Color,
  padding: '0 10px',
  height: '45px',
  minHeight: '45px',
  position: 'fixed',
  bottom: '0',
  width: 'calc(100% - 20px)',
  display: 'inline-flex',
  justifyContent: 'space-between'
}));

const SocialImage = styled('img')({
  height: '25px',
  paddingTop: '5px',
  paddingLeft: '5px',
  paddingRight: '5px'
});

const LogoImage = styled(GCLogo)({
  '& > img': {
    height: '25px',
    paddingTop: '4px',
    paddingLeft: '5px',
    paddingRight: '5px'
  }
});

const Version = styled('span')({
  lineHeight: '36px',
  fontSize: 'x-small',
  paddingLeft: '5px'
});

const RightDiv = styled('div')({
  display: 'inline-flex'
});

const AppFooter = () => (
  <FooterBar>
    <RightDiv>
      <InternationalizedLink links={fseLinks}>
        <SocialImage src="/images/FSE.svg" alt="Logo FSE" />
      </InternationalizedLink>

      <InternationalizedLink links={licenceLinks}>
        <SocialImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>

      <Version>GC v3</Version>
    </RightDiv>

    <div>
      <LogoImage />
    </div>

    <div>
      <InternationalizedLink links={githubLink}>
        <SocialImage
          src="/images/icons8/brown/icons8-github-filled-100.png"
          alt="Grottocenter3 on GitHub"
        />
      </InternationalizedLink>
      <InternationalizedLink links={facebookLink}>
        <SocialImage
          src="/images/icons8/brown/icons8-facebook-filled-100.png"
          alt="Follow us on Facebook"
        />
      </InternationalizedLink>
      <InternationalizedLink links={twitterLink}>
        <SocialImage
          src="/images/icons8/brown/icons8-twitter-filled-100.png"
          alt="Follow us on Twitter"
        />
      </InternationalizedLink>
      <InternationalizedLink links={bloggerLinks}>
        <SocialImage
          src="/images/icons8/brown/icons8-blogger-filled-100.png"
          alt="Grottocenter blog"
        />
      </InternationalizedLink>
      <InternationalizedLink links={contactLinks}>
        <SocialImage
          src="/images/icons8/brown/icons8-secured-letter-filled-100.png"
          alt="Contact Grottocenter team"
        />
      </InternationalizedLink>
      <GCLink internal href="/ui/faq">
        <SocialImage
          src="/images/icons8/brown/icons8-faq-filled-100.png"
          alt="Need help?"
        />
      </GCLink>
    </div>
  </FooterBar>
);

export default AppFooter;
