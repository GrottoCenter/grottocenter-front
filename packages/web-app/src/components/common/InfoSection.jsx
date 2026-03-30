import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

const SectionWrapper = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const SectionTitle = styled(Typography)`
  font-weight: 600;
`;

const InfoSection = ({ title, children }) => (
  <SectionWrapper>
    {title && <SectionTitle variant="subtitle1" component="h3">{title}</SectionTitle>}
    {children}
  </SectionWrapper>
);

InfoSection.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired
};

export default InfoSection;
