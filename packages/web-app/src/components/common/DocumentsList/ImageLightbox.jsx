import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Dialog, IconButton, Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  NavigateBefore,
  NavigateNext,
  Close,
  Download
} from '@mui/icons-material';
import { useIntl } from 'react-intl';
import { decodeFileName, downloadFile, getLightboxSrc } from './utils/imageUtils';
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

const ZoomIndicator = styled(Box)`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 3;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  color: white;
  height: 40px;
  min-width: 40px;
  padding: 0 12px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 500;
  pointer-events: none;
  user-select: none;
  transition: opacity 0.2s;
`;

const TopBar = styled(Box)`
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  gap: 8px;
  padding: 12px;
  z-index: 3;
`;

const BottomBar = styled(Box)`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  gap: 2px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  z-index: 2;
  pointer-events: none;
`;

const LightboxImage = styled('img')`
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  user-select: none;
`;

const ImageLightbox = ({
  open,
  onClose,
  images,
  initialIndex = 0,
  description = null
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartDistance = useRef(null);
  const zoomAtPinchStart = useRef(1);
  const touchPanStart = useRef(null);
  const lastTapTime = useRef(0);
  const { formatMessage } = useIntl();

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex, open]);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleWheel = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  }, []);

  const handleTouchMove = useCallback(e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      if (touchStartDistance.current === null) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setZoom(
        Math.min(Math.max(zoomAtPinchStart.current * (dist / touchStartDistance.current), 0.5), 5)
      );
    } else if (e.touches.length === 1 && touchPanStart.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - touchPanStart.current.x;
      const dy = e.touches[0].clientY - touchPanStart.current.y;
      touchPanStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsTouchPanning(true);
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  }, []);

  // Attach wheel + touchmove with { passive: false } so preventDefault() works in React 19
  const wheelNodeRef = useRef(null);
  const contentRef = useCallback(
    node => {
      if (wheelNodeRef.current) {
        wheelNodeRef.current.removeEventListener('wheel', handleWheel);
        wheelNodeRef.current.removeEventListener('touchmove', handleTouchMove);
      }
      wheelNodeRef.current = node;
      if (node) {
        node.addEventListener('wheel', handleWheel, { passive: false });
        node.addEventListener('touchmove', handleTouchMove, { passive: false });
      }
    },
    [handleWheel, handleTouchMove]
  );

  const handleMouseDown = e => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = e => {
    if (isDragging) {
      e.preventDefault();
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = useCallback(
    e => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDistance.current = Math.sqrt(dx * dx + dy * dy);
        zoomAtPinchStart.current = zoom;
        touchPanStart.current = null;
      } else if (e.touches.length === 1 && zoom > 1) {
        touchStartDistance.current = null;
        touchPanStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        touchStartDistance.current = null;
        touchPanStart.current = null;
      }
    },
    [zoom]
  );

  const handleTouchEnd = useCallback(e => {
    const wasPinch = touchStartDistance.current !== null;
    touchStartDistance.current = null;
    touchPanStart.current = null;
    setIsTouchPanning(false);

    // Double-tap to zoom — skip if ending a pinch gesture
    if (!wasPinch && e.changedTouches.length === 1) {
      const now = Date.now();
      if (now - lastTapTime.current < 300) {
        setZoom(prev => (prev > 1 ? 1 : 2.5));
        setPosition({ x: 0, y: 0 });
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = e => {
      if (!open) return;
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
  }, [open, handlePrevious, handleNext]);

  if (!currentImage) return null;

  return (
    <LightboxDialog
      open={open}
      onClose={onClose}
      fullScreen
      aria-label={decodeFileName(currentImage.fileName)}>
      <Box
        ref={contentRef}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}>
        <LightboxImage
          src={getLightboxSrc(currentImage)}
          alt={decodeFileName(currentImage.fileName)}
          draggable={false}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
              position.y / zoom
            }px)`,
            transition: isDragging || isTouchPanning ? 'none' : 'transform 0.2s',
            transformOrigin: 'center',
            cursor:
              zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        />

        {zoom !== 1 && (
          <ZoomIndicator>{Math.round(zoom * 100)}%</ZoomIndicator>
        )}

        <TopBar>
          <OverlayButton
            onClick={() =>
              downloadFile(
                currentImage.completePath,
                decodeFileName(currentImage.fileName)
              )
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

        {hasMultipleImages && (
          <>
            <NavButton
              className="previous"
              onClick={handlePrevious}
              aria-label={formatMessage({ id: 'Previous image' })}
              size="large">
              <NavigateBefore fontSize="large" />
            </NavButton>
            <NavButton
              className="next"
              onClick={handleNext}
              aria-label={formatMessage({ id: 'Next image' })}
              size="large">
              <NavigateNext fontSize="large" />
            </NavButton>
          </>
        )}

        <BottomBar>
          <Typography
            variant="caption"
            sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
            {decodeFileName(currentImage.fileName)}
          </Typography>
          {(currentImage.description || description) && (
            <Typography
              variant="body2"
              sx={{ color: 'white', textAlign: 'center' }}>
              {currentImage.description || description}
            </Typography>
          )}
          {hasMultipleImages && (
            <Typography
              variant="caption"
              sx={{ color: 'rgba(255,255,255,0.45)' }}>
              {formatMessage(
                { id: 'Image {current} of {total}' },
                { current: currentIndex + 1, total: images.length }
              )}
            </Typography>
          )}
        </BottomBar>
      </Box>
    </LightboxDialog>
  );
};

ImageLightbox.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string.isRequired,
      completePath: PropTypes.string.isRequired,
      thumbnails: ThumbnailsPropTypes,
      description: PropTypes.string
    })
  ).isRequired,
  initialIndex: PropTypes.number,
  description: PropTypes.string
};

export default ImageLightbox;
