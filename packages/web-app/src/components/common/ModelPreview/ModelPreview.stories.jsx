import MODEL_URL from '@/../cypress/fixtures/model-preview.glb?url';
import POSTER_URL from '@/../cypress/fixtures/model-preview.svg?url';
import ModelPreview from './index';

const meta = {
  title: 'Common/ModelPreview',
  component: ModelPreview,
  parameters: { layout: 'padded' }
};
export default meta;

// Owned, minimal fixtures keep the stories independent of API availability.
export const WithThumbnail = {
  args: {
    src: MODEL_URL,
    title: 'Triangle.glb',
    poster: POSTER_URL
  }
};

export const WithoutThumbnail = {
  args: { src: MODEL_URL, title: 'Triangle.glb' }
};

export const Unavailable = {
  args: { src: './unavailable-model.glb', title: 'Unavailable.glb' }
};
