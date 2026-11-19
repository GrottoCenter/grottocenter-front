import { useState, useEffect, useCallback, useId } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  Dialog,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Close from '@mui/icons-material/Close';
import Download from '@mui/icons-material/Download';
import Info from '@mui/icons-material/Info';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import NavigateBefore from '@mui/icons-material/NavigateBefore';
import NavigateNext from '@mui/icons-material/NavigateNext';
import { useIntl } from 'react-intl';
import VideoPreview from '@/components/common/VideoPreview';
import PanoramaPreview from '@/components/common/PanoramaPreview';
import { getVideoPoster, isVideoFile } from '@/utils/mediaUtils';
import FlatImagePreview from './FlatImagePreview';
import { decodeFileName, downloadFile } from './utils/imageUtils';
import { ThumbnailsPropTypes } from '../../../types/document.type';

const LightboxDialog = styled(Dialog)`
  .MuiDialog-paper {
    background-color: rgba(0, 0, 0, 0.95);
    margin: 0;
    max-width: 100%;
    max-height: 100%;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
`;

const OverlayButton = styled(IconButton)`
  color: white;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  width: ${({ theme }) => theme.spacing(6)};
  height: ${({ theme }) => theme.spacing(6)};

  &:hover,
  &:focus-visible {
    background-color: rgba(0, 0, 0, 0.65);
  }
`;

const NavButton = styled(OverlayButton)`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;

  &.previous {
    left: 12px;
  }
  &.next {
    right: 12px;
  }

  @media (min-width: 600px) {
    &.previous {
      left: 24px;
    }
    &.next {
      right: 24px;
    }
  }
`;

const TopBar = styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: ${({ theme }) => theme.spacing(1)};
  padding: ${({ theme }) => theme.spacing(1.5)};
  z-index: 3;
`;

const BottomBar = styled(Box, {
  shouldForwardProp: prop => prop[0] !== '$'
})(({ theme, $isVideo, $isPanorama, $isCaptionVisible }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(0.25),
  zIndex: 2,
  opacity: $isCaptionVisible ? 1 : 0,
  ...($isPanorama && !$isCaptionVisible && { display: 'none' }),
  transition: theme.transitions.create('opacity', {
    duration: theme.transitions.duration.shorter
  }),
  '@media (prefers-reduced-motion: reduce)': {
    transition: 'none'
  },
  ...($isVideo
    ? {
        position: 'static',
        flexShrink: 0,
        display: $isCaptionVisible ? 'flex' : 'none',
        padding: theme.spacing(1.5, 2),
        maxHeight: '35%',
        overflowY: 'auto',
        pointerEvents: 'auto',
        background: 'none'
      }
    : {
        position: $isPanorama ? 'static' : 'absolute',
        bottom: 0,
        width: '100%',
        left: 0,
        right: 0,
        padding: theme.spacing(3, 2, 1.5),
        background: `linear-gradient(
          to top,
          rgba(0, 0, 0, 0.85) 0%,
          rgba(0, 0, 0, 0.65) 60%,
          transparent 100%
        )`,
        pointerEvents: 'none'
      }),
  ...($isPanorama && {
    minHeight: 0,
    maxHeight: '35%',
    overflowY: 'auto',
    overflowWrap: 'anywhere',
    pointerEvents: 'auto',
    touchAction: 'pan-y'
  }),
  // Keep labels legible even on bright pixels at the gradient's top edge.
  '& > *': {
    textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)'
  }
}));

const MediaCounter = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(1.5),
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 2,
  color: 'rgba(255,255,255,0.85)',
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  backdropFilter: 'blur(4px)',
  pointerEvents: 'none',
  textShadow: '0 1px 3px rgba(0, 0, 0, 0.9)'
}));

const MediaLightbox = ({
  open,
  onClose,
  media,
  initialIndex = 0,
  description = null,
  documentTitle = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isCaptionVisible, setIsCaptionVisible] = useState(true);
  const captionId = useId();
  const captionTitleId = useId();

  const { formatMessage } = useIntl();

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (open) setIsCaptionVisible(true);
  }, [open]);

  const currentMedia = media[currentIndex];
  const isVideo = isVideoFile(currentMedia?.fileName);
  const isPanorama = !isVideo && currentMedia?.isPanorama === true;
  const hasVideos = media.some(file => isVideoFile(file.fileName));
  const hasMultipleMedia = media.length > 1;

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : media.length - 1));
  }, [media.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < media.length - 1 ? prev + 1 : 0));
  }, [media.length]);

  useEffect(() => {
    const handleKeyDown = e => {
      if (!open) return;
      // Arrow keys rotate the panorama instead of changing gallery images.
      if (isPanorama) return;
      // Arrow keys belong to the native video controls while they have focus.
      if (e.target instanceof HTMLVideoElement) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isPanorama, handlePrevious, handleNext]);

  if (!currentMedia) return null;

  const decodedFileName = decodeFileName(currentMedia.fileName);
  const captionTitle =
    currentMedia.documentTitle || documentTitle || decodedFileName;
  const captionDescription = currentMedia.description || description;

  let captionLabelId;
  if (hasVideos) {
    captionLabelId = isCaptionVisible
      ? 'media.hideCaption'
      : 'media.showCaption';
  } else {
    captionLabelId = isCaptionVisible
      ? 'Hide image caption'
      : 'Show image caption';
  }
  const captionToggleLabel = formatMessage({ id: captionLabelId });
  const mediaCounterLabel = hasMultipleMedia
    ? formatMessage(
        { id: hasVideos ? 'media.counter' : 'Image {current} of {total}' },
        { current: currentIndex + 1, total: media.length }
      )
    : null;

  const footer = (
    <>
      <BottomBar
        $isVideo={isVideo}
        $isPanorama={isPanorama}
        $isCaptionVisible={isCaptionVisible}
        data-testid="lightbox-caption"
        id={captionId}
        role={isPanorama ? 'group' : undefined}
        aria-labelledby={isPanorama ? captionTitleId : undefined}
        tabIndex={isPanorama && isCaptionVisible ? 0 : undefined}
        aria-hidden={!isCaptionVisible}>
        <Typography
          id={captionTitleId}
          variant="caption"
          sx={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>
          {captionTitle}
        </Typography>
        {captionDescription && (
          <Typography
            variant="body2"
            sx={{ color: 'white', textAlign: 'center' }}>
            {captionDescription}
          </Typography>
        )}
        {hasMultipleMedia && (
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.75)' }}>
            {mediaCounterLabel}
          </Typography>
        )}
      </BottomBar>
      {!isCaptionVisible && hasMultipleMedia && (
        <MediaCounter
          size="small"
          label={mediaCounterLabel}
          sx={
            isVideo || isPanorama
              ? {
                  position: 'static',
                  transform: 'none',
                  flexShrink: 0,
                  mb: 1.5
                }
              : undefined
          }
        />
      )}
    </>
  );

  return (
    <LightboxDialog
      open={open}
      onClose={onClose}
      fullScreen
      aria-label={decodedFileName}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: isVideo ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
        {isVideo ? (
          <Box
            data-testid="lightbox-video-stage"
            sx={{
              width: '100%',
              flex: '1 1 0',
              minHeight: 0,
              px: { xs: 7, sm: 10 },
              pt: 9,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
            {open && (
              <VideoPreview
                key={currentMedia.completePath}
                src={currentMedia.completePath}
                title={decodedFileName}
                poster={getVideoPoster(currentMedia)}
                isLightbox
              />
            )}
          </Box>
        ) : (
          isPanorama &&
          open && (
            <PanoramaPreview
              key={currentMedia.completePath}
              src={currentMedia.completePath}
              previewSrc={getVideoPoster(currentMedia)}
              title={captionTitle}
              footer={footer}
            />
          )
        )}

        {!isVideo && !isPanorama && (
          <FlatImagePreview
            key={`${currentIndex}:${currentMedia.completePath}`}
            src={currentMedia.completePath}
            alt={decodedFileName}
            isActive={open}
          />
        )}

        <TopBar>
          <Tooltip title={captionToggleLabel}>
            <OverlayButton
              onClick={() => setIsCaptionVisible(visible => !visible)}
              aria-label={captionToggleLabel}
              aria-expanded={isCaptionVisible}
              aria-controls={captionId}>
              {isCaptionVisible ? <Info /> : <InfoOutlined />}
            </OverlayButton>
          </Tooltip>
          <OverlayButton
            onClick={() =>
              downloadFile(currentMedia.completePath, decodedFileName)
            }
            aria-label={formatMessage({ id: 'Download' })}>
            <Download />
          </OverlayButton>
          <OverlayButton
            onClick={onClose}
            aria-label={formatMessage({ id: 'Close' })}>
            <Close />
          </OverlayButton>
        </TopBar>

        {hasMultipleMedia && (
          <>
            <NavButton
              className="previous"
              onClick={handlePrevious}
              aria-label={formatMessage({
                id: hasVideos ? 'media.previous' : 'Previous image'
              })}
              size="large">
              <NavigateBefore fontSize="large" />
            </NavButton>
            <NavButton
              className="next"
              onClick={handleNext}
              aria-label={formatMessage({
                id: hasVideos ? 'media.next' : 'Next image'
              })}
              size="large">
              <NavigateNext fontSize="large" />
            </NavButton>
          </>
        )}

        {!isPanorama && footer}
      </Box>
    </LightboxDialog>
  );
};

MediaLightbox.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  media: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string.isRequired,
      completePath: PropTypes.string.isRequired,
      isPanorama: PropTypes.bool,
      thumbnails: ThumbnailsPropTypes,
      description: PropTypes.string,
      documentTitle: PropTypes.string
    })
  ).isRequired,
  initialIndex: PropTypes.number,
  description: PropTypes.string,
  documentTitle: PropTypes.string
};

export default MediaLightbox;
