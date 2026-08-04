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

// No self-margin: spacing between sections is owned by the parent stack
// (see SectionStack), not by each card — margins between siblings collapse
// unpredictably and stack unpredictably with a parent's own padding/gap.
const Card = styled(MuiCard)`
  overflow: inherit;
  scroll-margin-top: ${({ theme }) => theme.appBarHeight}px;
`;

const Title = styled('div')`
  display: flex;
  justify-content: space-between;
`;

// `&&` doubles the class specificity on purpose. These wrappers are created at
// module-eval time, so their emotion classes are inserted BEFORE the ones MUI
// generates from the theme's MuiCardHeader / MuiCardContent styleOverrides at
// first render. On equal specificity the later rule wins, so the theme's
// `padding: spacing(2)` silently beat these and `dense` did nothing at all.
//
// The reduced bottom padding tightens the gap between the header and the
// content, so it only applies while the card is open. Collapsed, there is no
// content below it and trimming only the bottom would leave the header
// visibly lopsided against the theme's (responsive) top padding.
const CardHeader = styled(MuiCardHeader, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  ${({ $dense, $open, theme }) =>
    $dense && $open && `&& { padding-bottom: ${theme.spacing(1)}; }`}
`;

// `dense` means "tight" regardless of collapsibility: the top padding is
// dropped because the header above already provides the separation. Gating this
// on $collapsible left non-collapsible dense cards (Documents, Science) with the
// full theme padding on both sides — a 32px band under their title.
// The `:last-child` bottom padding is normalised in the theme (MuiCardContent),
// not here: a `&&` specificity bump from this wrapper does not reliably beat
// MUI's own rule, whereas a styleOverride composes into the same generated
// class and wins by source order.
const StyledCardContent = styled(CardContent, {
  shouldForwardProp: prop => prop[0] !== '$'
})`
  ${({ $dense }) => $dense && `&& { padding-top: 0; }`}
`;

// Exported so a section heading rendered outside a card (e.g. inside a page
// column) can carry the very same badge instead of re-creating its styling.
export const CountBadge = ({ count }) => (
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
  subheader,
  collapsible = true,
  defaultExpanded = true
}) => {
  useAnchorScroll(anchorId);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (defaultExpanded) setIsExpanded(true);
  }, [defaultExpanded]);

  // A non-collapsible card is always open.
  const isOpen = collapsible ? isExpanded : true;

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
              <Typography variant="h2" color="secondary">
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
      <Collapse in={isOpen} timeout="auto">
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
      return new Error(
        `${componentName} requires either 'content' or 'children' prop.`
      );
    }
    return null;
  },
  children: PropTypes.node,
  anchorId: PropTypes.string,
  dense: PropTypes.bool,
  subheader: PropTypes.node,
  collapsible: PropTypes.bool,
  defaultExpanded: PropTypes.bool
};

export default ScrollableContent;
