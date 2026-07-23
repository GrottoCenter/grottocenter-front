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
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  // Collapse h1's typographic leading so `align-items: center` centers the
  // icon on the em-box (≈ the visible letters) instead of on the taller
  // line-height box, which otherwise makes the icon look shifted.
  lineHeight: 1
});

const TitleIcon = styled('span')({
  display: 'inline-flex',
  alignItems: 'center',
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
