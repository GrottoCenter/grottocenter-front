import React from 'react';
import PropTypes from 'prop-types';
import { Container } from '@mui/material';

/**
 * Outermost page wrapper. Sole owner of the page frame — the 8px gutter around
 * all page content, on every side and every breakpoint. Because the frame lives
 * here (not on each section), every page gets it consistently whether or not it
 * uses <SectionStack>, and the inner components (PageHeader, PageTabs sections)
 * carry no outer margin of their own.
 *
 * `fullHeight` opts a page out of the frame: full-height layouts (chat, the
 * FixedContent card) size themselves with `calc(100vh - …)` / `height: 100%`
 * and provide their own margin, so an added container padding would just create
 * dead space or overflow.
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
