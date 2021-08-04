import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { withTheme } from '@material-ui/core/styles';
import { isMobileOnly } from 'react-device-detect';
import TextDiv from '../common/TextDiv';
import GCLink from '../common/GCLink';
import GCLogo from '../common/GCLogo';

const FlexDiv = styled.div`
  display: inline-flex;
`;

const TitleZone1 = withTheme(styled(TextDiv)`
  color: ${props => props.theme.palette.primary3Color};
  font-weight: 500;
  font-size: 20px;
  line-height: 12px;
`);

const TitleZone2 = withTheme(styled(TextDiv)`
  color: ${props => props.theme.palette.accent1Color};
  font-size: 8px;
`);

const GCLinkStl = styled(GCLink)`
  text-decoration: none;
`;

const LogoImage = styled(GCLogo)`
  margin-top: -5px;
  margin-right: 10px;
  margin-left: 10px;

  & > img {
    height: 20px;
    padding-top: 4px;
  }
`;

const HeaderTitle = ({ className, title, subtitle }) => (
  <FlexDiv className={className}>
    <LogoImage />
    {!isMobileOnly && (
      <GCLinkStl internal href="/">
        <TitleZone1>{title}</TitleZone1>
        <TitleZone2>{subtitle}</TitleZone2>
      </GCLinkStl>
    )}
  </FlexDiv>
);

HeaderTitle.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  className: PropTypes.string
};

export default styled(HeaderTitle)`
  width: ${!isMobileOnly && '200px !important'};
  text-align: center;
`;
