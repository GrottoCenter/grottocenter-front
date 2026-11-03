import MediaLightbox from './MediaLightbox';

// Preserve the image-only API for the document detail and existing consumers.
const ImageLightbox = ({
  images,
  open,
  onClose,
  initialIndex,
  description,
  documentTitle
}) => (
  <MediaLightbox
    media={images}
    open={open}
    onClose={onClose}
    initialIndex={initialIndex}
    description={description}
    documentTitle={documentTitle}
  />
);

ImageLightbox.propTypes = {
  images: MediaLightbox.propTypes.media,
  open: MediaLightbox.propTypes.open,
  onClose: MediaLightbox.propTypes.onClose,
  initialIndex: MediaLightbox.propTypes.initialIndex,
  description: MediaLightbox.propTypes.description,
  documentTitle: MediaLightbox.propTypes.documentTitle
};

export default ImageLightbox;
