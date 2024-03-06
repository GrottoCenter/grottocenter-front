import React from 'react';
import PropTypes from 'prop-types';
import withTheme from '@mui/styles/withTheme';
import { styled } from '@mui/material/styles';
import Translate from './Translate';
import InternationalizedLink from './InternationalizedLink';
import { licenceLinks } from '../../conf/externalLinks';

const FooterBar = withTheme(styled('div')`
  color: ${props => props.theme.palette.fullBlack};
  background-color: ${props => props.theme.palette.primary1Color};
  text-align: center;
  padding-top: 15px;
`);

// .fixFooter {
//   position: fixed;
//   bottom: 0;
//   width: 100%;
//   padding: 0;
// }

const DisclamerText = styled('p')`
  font-size: 1.2em;
  font-weight: 300;
  color: white;
  display: inline-block;
`;

const LicenceLink = styled('p')`
  display: inline-block;
`;

const LicenceImage = styled('img')`
  width: 80px;
  margin-left: 10px;
  display: inline-block;
`;

const FooterDisclamer = ({ className }) => (
  <FooterBar className={className}>
    <DisclamerText>
      <Translate>
        Unless stated otherwise, all text and documents are available under the
        terms
      </Translate>
    </DisclamerText>
    <LicenceLink>
      <InternationalizedLink links={licenceLinks}>
        <LicenceImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>
    </LicenceLink>
  </FooterBar>
);

FooterDisclamer.propTypes = {
  className: PropTypes.string
};
export default FooterDisclamer;
