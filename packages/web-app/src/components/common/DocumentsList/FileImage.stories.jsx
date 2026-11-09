import FileImage from './FileImage';

const meta = {
  title: 'Common/FileImage',
  component: FileImage,
  args: {
    file: { fileName: 'cave.jpg', completePath: '/images/caves/gours.jpg' },
    alt: 'Cave',
    sizes: '300px',
    sx: { width: 300, height: 160, objectFit: 'cover' }
  }
};

export default meta;

export const OriginalOnly = {};
export const MissingThumbnail = {
  args: {
    file: {
      fileName: 'cave.jpg',
      completePath: '/images/caves/gours.jpg',
      thumbnails: { small: '/missing-thumbnail.webp' }
    }
  }
};
