import PropTypes from 'prop-types';
import { Container } from '@mui/material';

/**
 * Outermost page wrapper. Sole owner of the page frame — the 8px gutter around
 * all page content, on every side and every breakpoint. Because the frame lives
 * here (not on each section), every page gets it consistently whether or not it
 * uses <SectionStack>, and the inner components (PageHeader, PageTabs sections,
 * FixedContent card) carry no outer margin of their own.
 *
 * `fullHeight` opts a page out of the frame for layouts that need to be
 * edge-to-edge in some viewport (e.g. Messages: the mail-style card is
 * edge-to-edge on mobile and gains its own 8px margin only on desktop).
 * FixedContent does NOT use this — it wants the standard 8px frame on every
 * breakpoint and lets PageContainer own it.
 */
const PageContainer = ({ children, fullHeight = false }) => (
  <Container maxWidth={false} disableGutters sx={{ p: fullHeight ? 0 : 1 }}>
    {children}
  </Container>
);

PageContainer.propTypes = {
  children: PropTypes.node.isRequired,
  fullHeight: PropTypes.bool
};

export default PageContainer;
