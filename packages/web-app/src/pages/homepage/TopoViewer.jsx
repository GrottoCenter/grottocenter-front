import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

import DocumentSvgViewer from '../../components/common/Maps/DocumentSvgViewer';

const SVG_URL = '/la-grande-topo.svg';

const ATTACHMENTS = [
  {
    id: 'att-1',
    anchorId: 'siphon-boue',
    documentId: 234115,
    label: 'CR explo 14 juillet 2020'
  },
  {
    id: 'att-2',
    anchorId: 'siphon-boue',
    documentId: 234116,
    label: 'CR explo 10 juin 2022'
  }
];

const Section = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4, 2)
}));

const TopoViewer = () => (
  <Section component="section">
    <Typography variant="h4" component="h2" align="center" gutterBottom>
      La Grande Topo
    </Typography>
    <DocumentSvgViewer svgUrl={SVG_URL} attachments={ATTACHMENTS} />
  </Section>
);

export default TopoViewer;
