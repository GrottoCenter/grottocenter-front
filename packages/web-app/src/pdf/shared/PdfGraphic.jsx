import { createElement } from 'react';
import PropTypes from 'prop-types';
import {
  Svg,
  G,
  Path,
  Rect,
  Circle,
  Ellipse,
  Line,
  Polygon,
  Polyline
} from '@react-pdf/renderer';

const elements = {
  svg: Svg,
  g: G,
  path: Path,
  rect: Rect,
  circle: Circle,
  ellipse: Ellipse,
  line: Line,
  polygon: Polygon,
  polyline: Polyline
};

export const PdfGraphic = ({ graphic, size = 20 }) => {
  if (!graphic) return null;
  const render = (node, key) =>
    createElement(
      elements[node.type],
      {
        ...node.props,
        key,
        ...(node.type === 'svg' ? { width: size, height: size } : {})
      },
      node.children.map((child, index) => render(child, index))
    );
  return render(graphic, 'graphic');
};

PdfGraphic.propTypes = {
  graphic: PropTypes.shape({
    type: PropTypes.string.isRequired,
    props: PropTypes.shape({}).isRequired,
    children: PropTypes.arrayOf(PropTypes.shape({})).isRequired
  }),
  size: PropTypes.number
};
