import { useState } from 'react';
import { Button } from '@mui/material';
import videoSource from '@/../cypress/fixtures/media-preview.webm';
import panoramaSource from '@/../cypress/fixtures/panorama-preview.jpg?url';
import MediaLightbox from './MediaLightbox';

const media = [
  {
    fileName: 'sphere.jpg',
    completePath: panoramaSource,
    thumbnails: { small: panoramaSource },
    isPanorama: true,
    documentTitle: '360-degree cave view'
  },
  {
    fileName: 'survey.png',
    completePath: 'https://placehold.co/640x480/png',
    documentTitle: 'Cave survey',
    description: 'An image and videos in the same gallery.'
  },
  {
    fileName: 'sample.webm',
    completePath: videoSource,
    documentTitle: 'Synthetic video sample'
  },
  {
    fileName: 'unsupported.mp4',
    completePath: '/unsupported.mp4',
    documentTitle: 'Playback error with original-file fallback'
  }
];

const MixedGalleryStory = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open mixed gallery</Button>
      <MediaLightbox
        open={isOpen}
        onClose={() => setIsOpen(false)}
        media={media}
      />
    </>
  );
};

export default {
  title: 'Common/MediaLightbox',
  component: MediaLightbox
};

export const MixedGallery = { render: MixedGalleryStory };
