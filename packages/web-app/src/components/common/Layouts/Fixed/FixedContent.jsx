import PropTypes from 'prop-types';

import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader
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

const FixedContent = ({ subheader, title, icon, action, content }) => (
  <PageContainer>
    <Card>
      <CardHeader
        disableTypography
        title={
          <PageTitle
            title={title}
            icon={icon}
            subheader={subheader}
            actions={action}
          />
        }
      />
      <CardContent>{content}</CardContent>
    </Card>
  </PageContainer>
);

FixedContent.propTypes = {
  action: PropTypes.node,
  content: PropTypes.node.isRequired,
  icon: PropTypes.node,
  subheader: PropTypes.node,
  title: PropTypes.oneOfType([PropTypes.node, PropTypes.string])
};

export default FixedContent;
