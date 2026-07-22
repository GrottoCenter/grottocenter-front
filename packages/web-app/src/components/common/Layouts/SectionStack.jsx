import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';

/**
 * Vertical stack that owns the spacing *between* page sections — and only that.
 *
 * Single-responsibility split: the page frame (the gutter around all content)
 * belongs to <PageContainer>; the gap between stacked sections belongs here.
 * So SectionStack contributes `gap` only, no padding — the surrounding
 * PageContainer already insets the whole page. Use it to wrap the section
 * cards of a page or a tab panel; <ScrollableContent> never margins itself.
 *
 * - `gap: 1` → 8px between sections (theme.spacing(1))
 */
const SectionStack = ({ children, ...props }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1
    }}
    {...props}>
    {children}
  </Box>
);

SectionStack.propTypes = {
  children: PropTypes.node
};

export default SectionStack;
