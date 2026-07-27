import React from 'react';
import PropTypes from 'prop-types';
import { Box, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const Row = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: theme.spacing(0.5)
}));

const TitleGroup = styled('div')({
  flex: 1,
  minWidth: 0
});

const TitleHeading = styled(Typography)({
  wordBreak: 'break-word',
  // Collapse h1's typographic leading so the inline icon centers on the em-box
  // (≈ the visible letters) instead of on the taller line-height box.
  lineHeight: 1
});

// Inline (not a flex child) so the icon only occupies space on the first line:
// when the title wraps, subsequent lines flow full-width beneath the icon
// instead of being vertically centered against it.
const TitleIcon = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
  // `vertical-align: middle` centers on the font's x-height, but the title is
  // capitalized text whose optical center is the (taller) cap-height. Nudge up
  // ~half the cap/x-height gap so the icon lines up with the caps. em-relative
  // so it tracks the responsive h1 size; `top` avoids disturbing the line box.
  verticalAlign: 'middle',
  position: 'relative',
  top: '-0.1em',
  flexShrink: 0
});

const Actions = styled('div')({
  flexShrink: 0
});

const PageTitle = ({ title, icon, titleAdornment, subheader, actions }) => {
  const hasTitle = title !== undefined && title !== null;
  return (
    <Box>
      <Row>
        <TitleGroup>
          {hasTitle ? (
            <TitleHeading variant="h1" color="secondary">
              {icon && <TitleIcon>{icon}</TitleIcon>}
              {title}
              {titleAdornment}
            </TitleHeading>
          ) : (
            <TitleHeading variant="h1">
              <Skeleton variant="text" width="100%" />
            </TitleHeading>
          )}
        </TitleGroup>
        {actions && <Actions>{actions}</Actions>}
      </Row>
      {subheader && (
        // Kill the legacy Skeleton-CSS `li { margin-bottom: 1rem }` rule from
        // App.css that leaks into MUI Breadcrumbs items and stacks unwanted
        // vertical space below the subheader.
        <Box sx={{ '& li': { mb: 0 } }}>{subheader}</Box>
      )}
    </Box>
  );
};

PageTitle.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.node,
  titleAdornment: PropTypes.node,
  subheader: PropTypes.node,
  actions: PropTypes.node
};

export default PageTitle;
