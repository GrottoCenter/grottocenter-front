import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, ButtonBase } from '@mui/material';
import { styled } from '@mui/material/styles';
import FitScreen from '@mui/icons-material/FitScreen';
import { useIntl } from 'react-intl';
import LoadingIndicator from '@/components/common/LoadingIndicator';

// The bitmap already fits at 100%; smaller zooms would leave unused space.
const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

// The zoom readout also resets the view, using the lightbox overlay treatment.
const ZoomResetButton = styled(ButtonBase)`
  position: absolute;
  top: ${({ theme }) => theme.spacing(9)};
  left: ${({ theme }) => theme.spacing(1.5)};
  z-index: 3;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  color: white;
  height: ${({ theme }) => theme.spacing(5)};
  min-width: ${({ theme }) => theme.spacing(5)};
  padding: ${({ theme }) => theme.spacing(0, 1.5)};
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing(0.5)};
  font-size: 0.875rem;
  font-weight: 500;
  user-select: none;
  transition: opacity 0.2s;

  &:hover,
  &:focus-visible {
    background-color: rgba(0, 0, 0, 0.65);
  }
`;

const LightboxImage = styled('img')`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
  user-select: none;
`;

// Key by file identity to reset loading and gestures on navigation. Keep the
// bitmap mounted during the dialog exit, but reset gestures when it closes.
const FlatImagePreview = ({ src, alt, isActive = true }) => {
  const { formatMessage } = useIntl();
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isTouchPanning, setIsTouchPanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const touchStartDistance = useRef(null);
  const zoomAtPinchStart = useRef(MIN_ZOOM);
  const touchPanStart = useRef(null);
  const lastTapTime = useRef(0);

  let panCursor = 'default';
  if (zoom > MIN_ZOOM) panCursor = isDragging ? 'grabbing' : 'grab';

  const handleImageLoad = event => {
    setIsLoading(false);
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (naturalWidth > 0 && naturalHeight > 0) {
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  // Resetting the pan alongside the zoom: at 100% the image fits the viewport,
  // so a leftover offset would push it off-screen with no way left to drag it
  // back (panning is gated on `zoom > MIN_ZOOM`).
  const handleResetZoom = useCallback(() => {
    setZoom(MIN_ZOOM);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleWheel = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setZoom(prev => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
  }, []);

  const handleTouchMove = useCallback(e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      if (touchStartDistance.current === null) return;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setZoom(
        Math.min(
          Math.max(
            zoomAtPinchStart.current * (dist / touchStartDistance.current),
            MIN_ZOOM
          ),
          MAX_ZOOM
        )
      );
    } else if (e.touches.length === 1 && touchPanStart.current !== null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - touchPanStart.current.x;
      const dy = e.touches[0].clientY - touchPanStart.current.y;
      touchPanStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
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
    if (zoom > MIN_ZOOM) {
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
      } else if (e.touches.length === 1 && zoom > MIN_ZOOM) {
        touchStartDistance.current = null;
        touchPanStart.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
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
        setZoom(prev => (prev > MIN_ZOOM ? MIN_ZOOM : 2.5));
        setPosition({ x: 0, y: 0 });
        lastTapTime.current = 0;
      } else {
        lastTapTime.current = now;
      }
    }
  }, []);

  useEffect(() => {
    if (isActive) return;
    handleResetZoom();
    setIsDragging(false);
    setIsTouchPanning(false);
    touchStartDistance.current = null;
    touchPanStart.current = null;
    lastTapTime.current = 0;
  }, [isActive, handleResetZoom]);

  return (
    <Box
      ref={contentRef}
      data-testid="lightbox-image-stage"
      aria-busy={isLoading}
      sx={{
        position: 'absolute',
        inset: 0,
        containerType: 'size',
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
        data-testid="lightbox-image"
        src={src}
        alt={alt}
        draggable={false}
        onLoad={handleImageLoad}
        onError={() => setIsLoading(false)}
        sx={{
          backgroundColor: aspectRatio ? 'common.white' : 'transparent'
        }}
        style={{
          opacity: isLoading ? 0 : 1,
          // Fit the backing to the bitmap rather than a full-screen object-fit box.
          width: aspectRatio ? `min(100cqw, ${100 * aspectRatio}cqh)` : '100%',
          height: aspectRatio ? `min(100cqh, ${100 / aspectRatio}cqw)` : '100%',
          transform: `scale(${zoom}) translate(${position.x / zoom}px, ${
            position.y / zoom
          }px)`,
          transition: isDragging || isTouchPanning ? 'none' : 'transform 0.2s',
          transformOrigin: 'center',
          cursor: panCursor
        }}
      />
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            p: 3,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'common.white'
          }}>
          <LoadingIndicator />
        </Box>
      )}

      {zoom !== MIN_ZOOM && (
        <ZoomResetButton
          onClick={handleResetZoom}
          // The image behind reads raw pointer and touch events to pan and to
          // detect a double-tap zoom. Without stopping them here, pressing the
          // button would also grab the image, and a tap would count towards
          // the double-tap that zooms it back in — undoing the reset.
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
          aria-label={formatMessage({ id: 'Reset zoom' })}>
          <FitScreen fontSize="small" />
          {`${Math.round(zoom * 100)}%`}
        </ZoomResetButton>
      )}
    </Box>
  );
};

FlatImagePreview.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  isActive: PropTypes.bool
};

export default FlatImagePreview;
