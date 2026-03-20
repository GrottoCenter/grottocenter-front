import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Translate from './Translate';
import InternationalizedLink from './InternationalizedLink';
import { licenceLinks, licensesODBLink } from '../../conf/externalLinks';

const FooterBar = styled('div')(({ theme }) => ({
  color: theme.palette.fullBlack,
  backgroundColor: theme.palette.primary1Color,
  textAlign: 'center',
  padding: '15px 16px 8px'
}));

// .fixFooter {
//   position: fixed;
//   bottom: 0;
//   width: 100%;
//   padding: 0;
// }

const DisclamerText = styled('p')`
  font-size: 1.2rem;
  font-weight: 300;
  color: white;
  margin: 0;
`;

const LicenceLine = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
`;

const LicenceImage = styled('img')`
  width: 80px;
  margin-left: 10px;
  display: inline-block;
`;

const FooterDisclamer = ({ className }) => (
  <FooterBar className={className}>
    <LicenceLine>
      <DisclamerText>
        <Translate>
          Unless stated otherwise, the CC-BY-SA license applies for documents
          and texts subject to copyright.
        </Translate>
      </DisclamerText>
      <InternationalizedLink links={licenceLinks}>
        <LicenceImage src="/images/CC-BY-SA.png" alt="CC-BY-SA licence" />
      </InternationalizedLink>
    </LicenceLine>
    <LicenceLine>
      <DisclamerText>
        <Translate>
          The ODBL license applies to all data that is not copyrighted.
        </Translate>
      </DisclamerText>
      <InternationalizedLink links={licensesODBLink}>
        <LicenceImage src="/images/odbl.png" alt="ODBL license" />
      </InternationalizedLink>
    </LicenceLine>
  </FooterBar>
);

FooterDisclamer.propTypes = {
  className: PropTypes.string
};
export default FooterDisclamer;
