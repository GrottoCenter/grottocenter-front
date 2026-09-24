import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

import DocumentSvgViewer from '../../components/common/Maps/DocumentSvgViewer';

const SVG_URL = '/la-grande-topo.svg';

const Section = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 2)
}));

// Points are created from the viewer (right-click) and persisted locally; no
// initial points are seeded here.
const TopoViewer = () => (
  <Section component="section">
    <Typography variant="h4" component="h2" align="center" gutterBottom>
      La Grande Topo
    </Typography>
    <DocumentSvgViewer svgUrl={SVG_URL} />
  </Section>
);

export default TopoViewer;
