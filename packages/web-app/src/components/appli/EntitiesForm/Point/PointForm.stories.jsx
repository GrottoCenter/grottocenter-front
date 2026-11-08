import PointForm from './index';

export default {
  title: 'Forms/Point',
  component: PointForm,
  args: {
    isNew: true,
    onSubmit: async () => undefined,
    onCancel: () => undefined
  }
};

export const Create = {};

export const Surface = {
  args: {
    isNew: false,
    values: {
      id: 1,
      label: 'Surface station',
      underground: false,
      latitude: 45,
      longitude: 6
    }
  }
};
