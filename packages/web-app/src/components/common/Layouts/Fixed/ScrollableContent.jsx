import PropTypes from 'prop-types';
import React from 'react';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';
import {
  Card as MuiCard,
  CardContent,
  CardHeader as MuiCardHeader,
  Typography
} from '@mui/material';
import AnchorCopyButton, { AnchorHeadingWrapper } from '../../AnchorCopyButton';
import { useAnchorScroll } from '../../../../hooks';

const Card = styled(MuiCard)`
  overflow: inherit;
  margin: ${({ theme }) => theme.spacing(1)} ${({ theme }) => theme.spacing(2)};
  scroll-margin-top: ${({ theme }) => theme.appBarHeight}px;
`;

const Title = styled('div')`
  display: flex;
  justify-content: space-between;
`;

const CardHeader = styled(MuiCardHeader, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  ${({ $dense }) => $dense && `padding-bottom: 0px`}
`;

const StyledCardContent = styled(CardContent)`
  &:last-child {
    padding-bottom: ${({ theme }) => theme.spacing(2)};
  }
`;

const ScrollableContent = ({ title, icon, content, anchorId, dense = false, subTitle = false, subheader }) => {
  useAnchorScroll(anchorId);

  return (
    <Card id={anchorId}>
      <CardHeader
        $dense={dense ? 1 : 0}
        subheader={subheader}
        title={
          <Title>
            <Typography
              variant={subTitle ? 'h3' : 'h2'}
              color={subTitle ? 'textPrimary' : 'secondary'}>
              {anchorId ? (
                <AnchorHeadingWrapper>
                  {title}
                  <AnchorCopyButton anchorId={anchorId} />
                </AnchorHeadingWrapper>
              ) : (
                title
              )}
            </Typography>
            {!isNil(icon) && icon}
          </Title>
        }
      />
      <StyledCardContent>{content}</StyledCardContent>
    </Card>
  );
};

ScrollableContent.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.node,
  content: PropTypes.node.isRequired,
  anchorId: PropTypes.string,
  dense: PropTypes.bool,
  subTitle: PropTypes.bool,
  subheader: PropTypes.node
};

export default ScrollableContent;
