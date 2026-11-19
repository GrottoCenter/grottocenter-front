import source from '@/../cypress/fixtures/panorama-preview.jpg?url';
import PanoramaPreview from './index';

export default {
  title: 'Common/PanoramaPreview',
  component: PanoramaPreview,
  decorators: [
    Story => (
      <div style={{ height: '80vh' }}>
        <Story />
      </div>
    )
  ]
};

export const Equirectangular = {
  args: { src: source, title: 'Synthetic panorama' }
};

export const Unavailable = {
  args: { src: '/unavailable-panorama.jpg', title: 'Unavailable panorama' }
};
