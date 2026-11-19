import source from '@/../cypress/fixtures/panorama-preview.jpg?url';
import FlatImagePreview from './FlatImagePreview';

const meta = {
  title: 'Common/FlatImagePreview',
  component: FlatImagePreview,
  decorators: [
    Story => (
      <div style={{ position: 'relative', height: '80vh' }}>
        <Story />
      </div>
    )
  ]
};

export default meta;

export const Image = { args: { src: source, alt: 'Synthetic cave panorama' } };
