import React from 'react';

import DocumentSvgViewer from '@/components/common/Maps/DocumentSvgViewer';

const SVG_URL = '/la-grande-topo.svg';

// Minimal dedicated page for the SVG topo viewer (route /ui/topo).
const Topo = () => <DocumentSvgViewer svgUrl={SVG_URL} height="100vh" />;

export default Topo;
