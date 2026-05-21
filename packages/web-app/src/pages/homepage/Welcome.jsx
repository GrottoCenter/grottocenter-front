import React from 'react';
import { styled, useTheme } from '@mui/material/styles';
import { useIntl } from 'react-intl';
import LandingSection from './LandingSection';
import {
  GridRow,
  GridOneThirdColumn,
  GridTwoThirdColumn
} from '../../helpers/GridSystem';

const WelcomeAvatar = styled('img')`
  border-radius: 50%;
  width: 60%;
  height: 60%;
`;

const WelcomeParagraph = styled('p')`
  text-align: justify;
  font-weight: 300;
  font-size: large;
`;

const WelcomeSection = styled(LandingSection)`
  > div:first-of-type {
    text-align: center;
  }
`;

const Welcome = () => {
  const theme = useTheme();
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

export default Welcome;
