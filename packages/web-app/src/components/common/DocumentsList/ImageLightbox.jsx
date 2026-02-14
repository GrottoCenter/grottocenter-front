import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Box, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { NavigateBefore, NavigateNext, Download } from '@mui/icons-material';
import { useIntl } from 'react-intl';
import StandardDialog from '../StandardDialog';

const LightboxContent = styled(Box)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 165px);
  position: relative;
  overflow: hidden;
`;

const NavigationButton = styled(IconButton)`
  position: absolute;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  z-index: 1;

  &:hover {
    background-color: rgba(0, 0, 0, 0.7);
  }

  &.previous {
    left: 20px;
  }

  &.next {
    right: 20px;
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

  const handleWheel = e => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

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
          {currentImage.fileName}
        </Typography>
      }
      actions={
        <Button
          startIcon={<Download />}
          href={currentImage.completePath}
          download
          target="_blank"
          variant="contained"
          color="primary"
        >
          {formatMessage({ id: 'Download image' })}
        </Button>
      }
    >
      <LightboxContent>
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
          alt={currentImage.fileName}
          onWheel={handleWheel}
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 0.25,
          px: 2,
          py: 0.25,
          minHeight: '24px'
        }}
      >
        {hasMultipleImages && (
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', flexShrink: 0 }}
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
        {description && (
          <Typography
            variant="body2"
            sx={{
              textAlign: hasMultipleImages ? 'right' : 'center',
              color: 'text.secondary',
              flex: 1,
              ml: hasMultipleImages ? 2 : 0
            }}
          >
            {description}
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
      completePath: PropTypes.string.isRequired
    })
  ).isRequired,
  initialIndex: PropTypes.number,
  description: PropTypes.string
};

export default ImageLightbox;
