import React from 'react';
import PropTypes from 'prop-types';
import { is } from 'ramda';
import { Box, Card, Skeleton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

const isString = is(String);

const TitleHeading = styled(Typography)`
  word-break: break-word;
`;

const TitleIcon = styled('span')`
  display: inline-flex;
  vertical-align: middle;
  margin-right: 8px;
  margin-bottom: 2px;
`;

const PageHeader = ({ title, icon, titleAdornment, subheader, actions }) => (
  <Card sx={{ mx: 1, mt: 0.5, mb: 0.5, p: { xs: 1, md: 2 } }}>
    <Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 0.5
        }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {isString(title) ? (
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
        </Box>
        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Box>
      {subheader && <Box>{subheader}</Box>}
    </Box>
  </Card>
);

PageHeader.propTypes = {
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  icon: PropTypes.node,
  titleAdornment: PropTypes.node,
  subheader: PropTypes.node,
  actions: PropTypes.node
};

export default PageHeader;
