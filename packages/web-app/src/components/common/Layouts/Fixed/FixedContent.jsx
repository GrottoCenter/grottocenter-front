import React from 'react';
import PropTypes from 'prop-types';

import {
  Box,
  Typography,
  Card as MuiCard,
  CardContent as MuiCardContent,
  CardHeader,
  Skeleton
} from '@mui/material';
import { styled } from '@mui/material/styles';

import PageContainer from '../PageContainer';

// height:100% would rely on every ancestor having an explicit height to
// resolve against (percentage heights are otherwise ignored) — fragile, and
// combined with the card's own margin it silently overflows its container by
// 2x that margin, clipping the bottom edge wherever an ancestor happens to
// clip overflow. Compute the height directly from the viewport instead, minus
// the app bar and this card's own margin (rendered inside
// <PageContainer fullHeight>, which adds no padding of its own) — the same
// proven approach as Messages' StyledCard.
const Card = styled(MuiCard)(({ theme }) => {
  const margin = theme.spacing(1);
  const chrome = `${margin} * 2`; // top + bottom margins
  return `
  margin: ${margin};
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
const CardContent = styled(MuiCardContent)`
  flex-grow: 1;
  overflow: auto;
  scroll-behavior: smooth;
  padding-top: 0;
`;

const Title = styled('span')`
  display: inline-flex;
  align-items: center;
`;

const TitleIcon = styled('span')`
  margin-right: 6px;
  display: inline-flex;
`;

const FixedContent = ({ subheader, title, icon, action, content }) => (
  <PageContainer fullHeight>
  <Card>
    <CardHeader
      subheader={subheader}
      title={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 0.5
          }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {title !== undefined && title !== null ? (
              <Title>
                {icon && <TitleIcon>{icon}</TitleIcon>}
                <Typography variant="h1" color="secondary">
                  {title}
                </Typography>
              </Title>
            ) : (
              <Skeleton />
            )}
          </Box>
          {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
        </Box>
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
