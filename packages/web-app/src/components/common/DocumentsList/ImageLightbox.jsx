import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NavigateBefore, NavigateNext, Download } from '@mui/icons-material';
import { useIntl } from 'react-intl';
import StandardDialog from '../StandardDialog';
import { decodeFileName, downloadFile } from './utils/imageUtils';

const LightboxContent = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 190px); /* fallback for old browsers */
  height: calc(100dvh - 190px);
  position: relative;
  overflow: hidden;
`;

const NavigationButton = styled(IconButton)`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.3);
  color: white;
  z-index: 1;

  &:hover,
  &:active,
  &:focus-visible {
    background-color: rgba(0, 0, 0, 0.5);
  }

  &.previous {
    left: 0;
  }

  &.next {
    right: 0;
  }

  @media (min-width: 600px) {
    &.previous {
      left: 20px;
    }

    &.next {
      right: 20px;
    }
  }

  @media (hover: hover) {
    &:hover {
      background-color: rgba(0, 0, 0, 0.7);
    }
  }
`;

const LightboxImage = styled('img')`
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { formatMessage } = useIntl();

  // Reset index when opening or when initialIndex changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
    }
  }, [open, initialIndex]);

  // Reset zoom and position when image changes or lightbox closes
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

  // Attach wheel with { passive: false } so preventDefault() works in React 19.
  // Uses a callback ref so the listener is added as soon as the dialog mounts
  // the node, and removed when it unmounts or the ref changes.
  const wheelNodeRef = useRef(null);
  const contentRef = useCallback(
    node => {
      if (wheelNodeRef.current) {
        wheelNodeRef.current.removeEventListener('wheel', handleWheel);
      }
      wheelNodeRef.current = node;
      if (node) {
        node.addEventListener('wheel', handleWheel, { passive: false });
      }
    },
    [handleWheel]
  );

  const handleMouseDown = e => {
    if (zoom > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = e => {
    if (isDragging) {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard navigation
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
  }, [open, currentIndex, images.length, handlePrevious, handleNext]);

  if (!currentImage) {
    return null;
  }

  return (
    <StandardDialog
      open={open}
      onClose={onClose}
      fullScreen
      maxWidth="xl"
      title={
        <Typography variant="subtitle1" component="h2">
          {decodeFileName(currentImage.fileName)}
        </Typography>
      }
      actions={
        <Button
          startIcon={<Download />}
          onClick={() =>
            downloadFile(
              currentImage.completePath,
              decodeFileName(currentImage.fileName)
            )
          }
          variant="contained"
          color="primary"
        >
          {formatMessage({ id: 'Download image' })}
        </Button>
      }
    >
      <LightboxContent ref={contentRef}>
        {hasMultipleImages && (
          <NavigationButton
            className="previous"
            onClick={handlePrevious}
            aria-label={formatMessage({ id: 'Previous image' })}
            size="large"
          >
            <NavigateBefore fontSize="large" />
          </NavigationButton>
        )}

        <LightboxImage
          src={currentImage.completePath}
          alt={decodeFileName(currentImage.fileName)}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          draggable={false}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
              position.y / zoom
            }px)`,
            transition: isDragging ? 'none' : 'transform 0.2s',
            transformOrigin: 'center',
            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            userSelect: 'none'
          }}
        />

        {hasMultipleImages && (
          <NavigationButton
            className="next"
            onClick={handleNext}
            aria-label={formatMessage({ id: 'Next image' })}
            size="large"
          >
            <NavigateNext fontSize="large" />
          </NavigationButton>
        )}
      </LightboxContent>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mt: '2px',
          px: 2,
          py: '2px',
          minHeight: '24px'
        }}
      >
        {(currentImage.description || description) && (
          <Typography
            variant="body2"
            sx={{
              textAlign: 'center',
              color: 'text.secondary'
            }}
          >
            {currentImage.description || description}
          </Typography>
        )}
        {hasMultipleImages && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary' }}
          >
            {formatMessage(
              { id: 'Image {current} of {total}' },
              {
                current: currentIndex + 1,
                total: images.length
              }
            )}
          </Typography>
        )}
      </Box>
    </StandardDialog>
  );
};

ImageLightbox.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  images: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string.isRequired,
      completePath: PropTypes.string.isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  initialIndex: PropTypes.number,
  description: PropTypes.string
};

export default ImageLightbox;
