import React from 'react';
import GiftIcon from '@material-ui/icons/CardGiftcard';
import Button from '@material-ui/core/Button';
import { withStyles, withTheme } from '@material-ui/core/styles';
import styled, { keyframes } from 'styled-components';
import Typography from '@material-ui/core/Typography/Typography';
import Translate from '../../components/common/Translate';

const btEyeCatcher = keyframes`
{
0.3% {
  padding-right: 10px;
  padding-left: 0;
}

0.6% {
  padding-right: 0;
  padding-left: 0;
}

0.9% {
  padding-right: 0;
  padding-left: 10px;
}

1.2% {
  padding-right: 0;
  padding-left: 0;
}

1.5% {
  padding-right: 5px;
  padding-left: 0;
}

1.8% {
  padding-right: 0;
  padding-left: 0;
}

2.1% {
  padding-right: 0;
  padding-left: 5px;
}

2.4% {
  padding-right: 0;
  padding-left: 0;
}

2.7% {
  padding-right: 5px;
  padding-left: 0;
}

3% {
  padding-right: 0;
  padding-left: 0;
}
}
`;

const DonateFormWrapper = styled.div`
  animation: ${btEyeCatcher} 3s linear infinite;

  @media (max-width: 550px) {
    float: initial;
    max-width: 100%;
    line-height: 5em;
    overflow: hidden;
  }
`;

const DonateButton = withStyles(
  theme => ({
    root: {
      backgroundColor: theme.palette.accent1Color,
      color: theme.palette.textIconColor,
      height: 'auto',
      marginTop: '10px',

      '&:hover': {
        backgroundColor: theme.palette.accent1Color
      },

      '&>div': {
        textAlign: 'center',
        whiteSpace: 'nowrap'
      },

      '& > span': {
        textTransform: 'none'
      }
    }
  }),
  { withTheme: true }
)(Button);

const StyledGiftIcon = withStyles(
  theme => ({
    root: {
      fill: theme.palette.textIconColor,
      width: '20px',
      height: '30px',
      marginRight: '10px'
    }
  }),
  { withTheme: true }
)(GiftIcon);

const StyledTypography = withStyles(
  theme => ({
    root: {
      fontSize: 'small',
      textAlign: 'center',
      color: theme.palette.textIconColor
    }
  }),
  { withTheme: true }
)(Typography);

const DonateForm = () => (
  <DonateFormWrapper>
    <DonateButton
      href="https://www.helloasso.com/associations/wikicaves/formulaires/1"
      target="_blank">
      <StyledGiftIcon />
      <StyledTypography component="span">
        <Translate id="Donate now" />
      </StyledTypography>
    </DonateButton>
  </DonateFormWrapper>
);

export default withTheme(DonateForm);
