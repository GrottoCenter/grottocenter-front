import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';
import { isNil } from 'ramda';
import {
  Card as MuiCard,
  CardContent,
  CardHeader as MuiCardHeader,
  Chip,
  Collapse,
  IconButton,
  Typography
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AnchorCopyButton, { AnchorHeadingWrapper } from '../../AnchorCopyButton';
import { useAnchorScroll } from '../../../../hooks';

const Card = styled(MuiCard)`
  overflow: inherit;
  margin: ${({ theme }) => theme.spacing(0.5)} ${({ theme }) => theme.spacing(1)};
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

const StyledCardContent = styled(CardContent, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  ${({ $dense, $collapsible }) => $dense && $collapsible && `padding-top: 0;`}
  &:last-child {
    padding-bottom: ${({ theme }) => theme.spacing(1)};
  }
`;

const CountBadge = ({ count }) => (
  <Chip
    label={count}
    size="small"
    sx={{
      ml: 0.5,
      fontWeight: 600,
      verticalAlign: 'middle'
    }}
  />
);

CountBadge.propTypes = {
  count: PropTypes.number.isRequired
};

const ScrollableContent = ({
  title,
  count,
  icon,
  content,
  children,
  anchorId,
  dense = false,
  subTitle = false,
  subheader,
  collapsible = true,
  defaultExpanded = true
}) => {
  useAnchorScroll(anchorId);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (defaultExpanded) setIsExpanded(true);
  }, [defaultExpanded]);

  return (
    <Card id={anchorId}>
      {title && (
        <CardHeader
          $dense={dense ? 1 : 0}
          subheader={subheader}
          onClick={collapsible ? () => setIsExpanded(v => !v) : undefined}
          sx={
            collapsible ? { cursor: 'pointer', userSelect: 'none' } : undefined
          }
          title={
            <Title>
              <Typography
                variant={subTitle ? 'h3' : 'h2'}
                color={subTitle ? 'textPrimary' : 'secondary'}>
                {anchorId ? (
                  <AnchorHeadingWrapper>
                    {title}
                    {!isNil(count) && <CountBadge count={count} />}
                    <span onClick={e => e.stopPropagation()}>
                      <AnchorCopyButton anchorId={anchorId} />
                    </span>
                  </AnchorHeadingWrapper>
                ) : (
                  <>
                    {title}
                    {!isNil(count) && <CountBadge count={count} />}
                  </>
                )}
              </Typography>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {!isNil(icon) && (
                  <div
                    onClick={e => {
                      e.stopPropagation();
                      if (!isExpanded) setIsExpanded(true);
                    }}>
                    {icon}
                  </div>
                )}
                {collapsible && (
                  <IconButton
                    size="small"
                    onClick={e => {
                      e.stopPropagation();
                      setIsExpanded(v => !v);
                    }}
                    sx={{
                      transition: 'transform 200ms',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                )}
              </div>
            </Title>
          }
        />
      )}
      <Collapse in={collapsible ? isExpanded : true} timeout="auto">
        <StyledCardContent
          $dense={dense ? 1 : 0}
          $collapsible={collapsible ? 1 : 0}>
          {content ?? children}
        </StyledCardContent>
      </Collapse>
    </Card>
  );
};

ScrollableContent.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  count: PropTypes.number,
  icon: PropTypes.node,
  content: (props, propName, componentName) => {
    if (!props.content && !props.children) {
      return new Error(`${componentName} requires either 'content' or 'children' prop.`);
    }
    return null;
  },
  children: PropTypes.node,
  anchorId: PropTypes.string,
  dense: PropTypes.bool,
  subTitle: PropTypes.bool,
  subheader: PropTypes.node,
  collapsible: PropTypes.bool,
  defaultExpanded: PropTypes.bool
};

export default ScrollableContent;
