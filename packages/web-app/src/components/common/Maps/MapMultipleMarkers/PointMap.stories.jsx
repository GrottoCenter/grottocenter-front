import Map from './index';
import { PointMarker } from '../common/Markers/Components/PointMarker';

export default {
  title: 'Maps/Point',
  component: Map,
  args: {
    positions: [{ id: 1, latitude: 43.35, longitude: 5.82 }],
    markerIcon: PointMarker
  }
};

export const SurfacePoint = {};
