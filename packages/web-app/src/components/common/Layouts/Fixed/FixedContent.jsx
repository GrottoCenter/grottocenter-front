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

const Card = styled(MuiCard)`
  margin: ${({ theme }) => theme.spacing(2)};
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const CardContent = styled(MuiCardContent)`
  flex-grow: 1;
  overflow-y: auto;
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
  <PageContainer>
  <Card>
    <CardHeader
      subheader={subheader}
      title={
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 1
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
