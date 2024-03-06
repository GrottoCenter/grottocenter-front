import React from 'react';
import GiftIcon from '@mui/icons-material/CardGiftcard';
import Button from '@mui/material/Button';
import { styled, keyframes } from '@mui/material/styles';
import Typography from '@mui/material/Typography/Typography';
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

const DonateFormWrapper = styled('div')`
  animation: ${btEyeCatcher} 3s linear infinite;

  @media (max-width: 550px) {
    float: initial;
    max-width: 100%;
    line-height: 5em;
    overflow: hidden;
  }
`;

const DonateButton = styled(Button)`
  background-color: ${({ theme }) => theme.palette.accent1Color};
  color: ${({ theme }) => theme.palette.textIconColor};
  height: auto;
  margin-ttop: 10px;

  &:hover {
    background-color: ${({ theme }) => theme.palette.accent1Color};
  }

  & > div {
    textalign: center;
    whitespace: nowrap;
  }

  & > span {
    texttransform: none;
  }
`;

const StyledGiftIcon = styled(GiftIcon)`
  fill: ${({ theme }) => theme.palette.textIconColor};
  width: 20px;
  height: 30px;
  margin-right: 10px;
`;

const StyledTypography = styled(Typography)`
  color: ${({ theme }) => theme.palette.textIconColor};
  font-size: small;
  text-align: center;
  margin-right: 10px;
`;

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

export default DonateForm;
