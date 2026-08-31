import React from 'react';
import { styled } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';

import DocumentSvgViewer from '../../components/common/Maps/DocumentSvgViewer';

const SVG_URL = '/la-grande-topo.svg';

// Points are georeferenced by the SVG's 3 control points (#control-1/2/3), not by
// anchors embedded in the SVG. `coordinates` is [u, v] in the control-point frame
// (control-1 = (0,0), control-2 = (1,0), control-3 = (0,1)); it stays valid even
// if the SVG is edited/re-exported, as long as the control points follow.
const POINTS = [
  {
    id: 'siphon-boue',
    coordinates: [0.4625, 0.4583],
    label: 'Siphon de la boue',
    documents: [
      { id: 'att-1', documentId: 234115, label: 'CR explo 14 juillet 2020' },
      { id: 'att-2', documentId: 234116, label: 'CR explo 10 juin 2022' }
    ]
  },
  {
    id: 'salle-phrygane',
    coordinates: [0.9167, 0.8153],
    label: 'Salle des phryganes',
    documents: [{ id: 'att-3', documentId: 234117, label: 'Topographie 2019' }]
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
    <DocumentSvgViewer svgUrl={SVG_URL} points={POINTS} />
  </Section>
);

export default TopoViewer;
