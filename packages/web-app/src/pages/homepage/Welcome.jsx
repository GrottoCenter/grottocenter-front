import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { useIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles';
import LandingSection from './LandingSection';
import {
  GridRow,
  GridOneThirdColumn,
  GridTwoThirdColumn
} from '../../helpers/GridSystem';
import Translate from '../../components/common/Translate';

const WelcomeAvatar = styled.img`
  border-radius: 50%;
  width: 60%;
  height: 60%;
`;

const WelcomeTitle = styled.h3`
  color: ${props => props.color};
  padding-top: 30px;
  text-align: center;
  padding-bottom: 50px;
  font-size: 35px;

  @media (min-width: 550px) {
    padding-top: 0;
  }
`;

const WelcomeParagraph = styled.p`
  text-align: justify;
  font-weight: 300;
  font-size: large;
`;

const WelcomeSection = styled(LandingSection)`
  > div:first-child {
    text-align: center;
  }
`;

const Welcome = ({ theme }) => {
  const { formatMessage } = useIntl();
  return (
    <WelcomeSection
      bgColor={theme.palette.primary1Color}
      fgColor={theme.palette.secondaryBlocTitle}>
      <GridRow>
        <GridOneThirdColumn>
          <WelcomeAvatar src="/images/caves/draperie_small.jpg" />
        </GridOneThirdColumn>

        <GridTwoThirdColumn>
          <WelcomeTitle color={theme.palette.accent1Color}>
            <Translate>Welcome to Grottocenter!</Translate>
          </WelcomeTitle>
          <WelcomeParagraph>
            <Translate>
              Welcome to the new version of Grottocenter, the community database
              dedicated to caving.
            </Translate>
          </WelcomeParagraph>
          <WelcomeParagraph>
            {formatMessage({
              id: 'All information is freely accessible, creating an account will allow you to contribute: all together we will be able to complete and make more reliable the information on caves, documents, organizations and massifs, linked to the underground environment.'
            })}
          </WelcomeParagraph>
          <WelcomeParagraph>
            {formatMessage({
              id: 'The Speleological Abstracts (SA / BBS) has joined Grottocenter to give you access to a very important collection of documents.'
            })}
            &nbsp;
            {formatMessage({
              id: "You can now contribute to SA / BBS, either directly or by joining your country's contributing team."
            })}
            &nbsp;
            {formatMessage({
              id: 'Contact us if you have any questions or if you want to participate in the project.'
            })}
          </WelcomeParagraph>
        </GridTwoThirdColumn>
      </GridRow>
    </WelcomeSection>
  );
};

Welcome.propTypes = {
  theme: PropTypes.shape({
    palette: PropTypes.shape({
      secondaryBlocTitle: PropTypes.string,
      primary1Color: PropTypes.string,
      accent1Color: PropTypes.string
    })
  }).isRequired
};

export default withTheme(Welcome);
