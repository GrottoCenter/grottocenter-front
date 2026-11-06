import CoordinatesProperty from './CoordinatesProperty';

const meta = {
  title: 'Common/Properties/Coordinates',
  component: CoordinatesProperty,
  args: {
    latitude: 44.1068,
    longitude: 6.705,
    precision: 10,
    entityType: 'entrance',
    entityId: 1
  }
};

export default meta;

export const Entrance = {};
export const SurfacePoint = {
  args: { precision: undefined, entityType: null, entityId: null }
};
