import MediaThumbnail from './MediaThumbnail';

const meta = {
  title: 'Common/MediaThumbnail',
  component: MediaThumbnail
};

export default meta;

export const VideoWithoutPoster = {
  args: { isVideo: true, alt: 'cave.mp4' }
};

export const VideoWithPoster = {
  args: {
    isVideo: true,
    alt: 'cave.mp4',
    src: 'https://placehold.co/640x480'
  }
};
