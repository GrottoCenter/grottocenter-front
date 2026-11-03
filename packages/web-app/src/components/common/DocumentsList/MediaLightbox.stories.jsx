import { useState } from 'react';
import { Button } from '@mui/material';
import videoSource from '@/../cypress/fixtures/media-preview.webm';
import MediaLightbox from './MediaLightbox';

const media = [
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
    fileName: 'unsupported.avi',
    completePath: '/unsupported.avi',
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
