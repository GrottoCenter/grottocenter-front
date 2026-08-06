import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from 'react';

import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader as MuiCardHeader
} from '@mui/material';
import { styled } from '@mui/material/styles';

import PageContainer from '../PageContainer';
import PageTitle from '../PageTitle';

// height:100% would rely on every ancestor having an explicit height to
// resolve against (percentage heights are otherwise ignored) — fragile.
// Compute the height directly from the viewport instead, minus the app bar
// and the 8px top+bottom inset contributed by PageContainer's padding.
const Card = styled(MuiCard)(({ theme }) => {
  const chrome = `${theme.spacing(1)} * 2`; // top + bottom insets from PageContainer
  return `
  display: flex;
  flex-direction: column;
  height: calc(100vh - ${theme.appBarHeight}px - (${chrome})); /* fallback */
  height: calc(100dvh - ${theme.appBarHeight}px - (${chrome}));
`;
});

// Material's "on-scroll elevation": the header only separates itself from the
// body once something actually passes under it — flat at scroll 0.
//
// `zIndex` has to outrank the bars that stick to the top of the scroller
// (results toolbar, table head, both at `appBar - 1`), otherwise they paint
// over the shadow at the exact moment it becomes useful. Sitting at `appBar` is
// safe here: the card starts below the real app bar and is capped to the
// remaining viewport, so the two never overlap.
const CardHeader = styled(MuiCardHeader, {
  shouldForwardProp: prop => prop[0] !== '$'
})(({ theme, $elevated }) => ({
  position: 'relative',
  zIndex: theme.zIndex.appBar,
  boxShadow: $elevated ? theme.shadows[2] : 'none',
  transition: theme.transitions.create('box-shadow', {
    duration: theme.transitions.duration.shorter
  })
}));

// Single scroll container for the page body, on BOTH axes. It owns the vertical
// scroll (bounded height via the flex column above) and the horizontal scroll
// for wide tables — the inner TableContainer deliberately does NOT scroll, so
// that sticky table headers resolve against THIS element (the same scroller the
// results toolbar sticks to) instead of being trapped in a nested scroll box.
//
// The doubled `&&` selector boosts specificity so that padding-top: 0 wins over
// the responsive `padding` shorthand from the MuiCardContent theme override —
// otherwise the theme's padding-top leaves a gap above the sticky toolbar and
// scrolled rows leak into it before hitting the sticky boundary.
const CardContent = styled(MuiCardContent)`
  flex-grow: 1;
  overflow: auto;
  scroll-behavior: smooth;
  && {
    padding-top: 0;
  }
`;

const FixedContent = ({ subheader, title, icon, action, content }) => {
  const scrollerRef = useRef(null);
  const sentinelRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Same approach as PageTabs' `isStuck`: watch a sentinel instead of listening
  // to scroll, so the work happens on the two boundary crossings only. The root
  // is the CardContent, not the viewport — the sentinel scrolls inside it.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => setIsScrolled(!entry.isIntersecting),
      { root: scrollerRef.current }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <PageContainer>
      <Card>
        <CardHeader
          disableTypography
          $elevated={isScrolled}
          title={
            <PageTitle
              title={title}
              icon={icon}
              subheader={subheader}
              actions={action}
            />
          }
        />
        <CardContent ref={scrollerRef}>
          {/* height: 0 — the scroller's padding-top is deliberately 0 so that
              the sticky bars sit flush against the header; any height here
              would insert a band above them and offset their sticky origin. */}
          <div ref={sentinelRef} style={{ height: 0 }} />
          {content}
        </CardContent>
      </Card>
    </PageContainer>
  );
};

FixedContent.propTypes = {
  action: PropTypes.node,
  content: PropTypes.node.isRequired,
  icon: PropTypes.node,
  subheader: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.string])
};

export default FixedContent;
