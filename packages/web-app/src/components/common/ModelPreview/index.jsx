import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const Frame = styled('div')(({ theme }) => ({
  '--model-background': theme.palette.grey[100],
  '--model-overlay-start': alpha(theme.palette.common.white, 0.25),
  '--model-overlay-end': alpha(theme.palette.common.white, 0.56),
  position: 'relative',
  width: '100%',
  height: 360,
  background: 'var(--model-background)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1.5),
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: { height: 480 },
  [theme.breakpoints.up('md')]: { height: 600 },
  '&[data-background="dark"]': {
    '--model-background': theme.palette.grey[900],
    '--model-overlay-start': alpha(theme.palette.grey[900], 0.25),
    '--model-overlay-end': alpha(theme.palette.grey[900], 0.56),
    color: theme.palette.common.white
  },
  '&:fullscreen': { width: '100%', height: '100dvh', border: 0 }
}));

// Emotion's HTML prop filter otherwise drops camera-controls and the other
// custom attributes, leaving the web component's camera controls disabled.
const Viewer = styled('model-viewer', {
  shouldForwardProp: prop => !['theme', 'sx', 'as', 'ownerState'].includes(prop)
})({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  display: 'block'
});

const Centered = styled('div')(({ theme }) => ({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  textAlign: 'center',
  background:
    'linear-gradient(135deg, var(--model-overlay-start), var(--model-overlay-end))'
}));

const Controls = styled('div')(({ theme }) => ({
  position: 'absolute',
  bottom: theme.spacing(2),
  left: '50%',
  transform: 'translateX(-50%)',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5),
  borderRadius: theme.spacing(4),
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[4],
  '& .MuiIconButton-root': { width: 44, height: 44 }
}));

const ControlButton = ({ label, onClick, testId, children }) => (
  <Tooltip
    title={label}
    placement="top"
    enterTouchDelay={500}
    slotProps={{ popper: { disablePortal: true } }}>
    <IconButton aria-label={label} onClick={onClick} data-testid={testId}>
      {children}
    </IconButton>
  </Tooltip>
);

ControlButton.propTypes = {
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

const ModelPreviewSession = ({ src, title, poster = null }) => {
  const { formatMessage } = useIntl();
  const frameRef = useRef(null);
  const viewerRef = useRef(null);
  const [status, setStatus] = useState('idle');
  const [isViewerReady, setIsViewerReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState(0);
  const [hasFullscreenError, setHasFullscreenError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkBackground, setIsDarkBackground] = useState(false);
  const [failedPoster, setFailedPoster] = useState(null);
  const isLoaded = status === 'ready';

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleStart = async () => {
    setStatus('loading');
    setProgress(0);
    try {
      // Register the web component only after the user requests a preview.
      const { ModelViewerElement } = await import('./modelViewer');
      // Large scans should not accumulate in the library's five-model cache.
      ModelViewerElement.modelCacheSize = 1;
      setIsViewerReady(true);
      setAttempt(current => current + 1);
    } catch (_error) {
      setStatus('error');
    }
  };

  useEffect(() => {
    if (!isViewerReady) return undefined;
    const viewer = viewerRef.current;
    const handleLoad = () => setStatus('ready');
    const handleError = () => setStatus('error');
    const handleProgress = event =>
      setProgress(Math.round(event.detail.totalProgress * 100));
    viewer.addEventListener('load', handleLoad);
    viewer.addEventListener('error', handleError);
    viewer.addEventListener('progress', handleProgress);
    // Subscribe before setting src: a cached model can finish immediately.
    // The library caches failed loads too. A retry needs a fresh URL and element.
    const modelUrl = new URL(src, window.location.href);
    if (attempt > 1) {
      modelUrl.searchParams.set('modelPreviewRetry', String(Date.now()));
    }
    viewer.src = modelUrl.href;
    return () => {
      viewer.removeEventListener('load', handleLoad);
      viewer.removeEventListener('error', handleError);
      viewer.removeEventListener('progress', handleProgress);
      viewer.removeAttribute('src');
    };
  }, [isViewerReady, src, attempt]);

  const handleReset = useCallback(async () => {
    const viewer = viewerRef.current;
    viewer.cameraOrbit = '0deg 75deg auto';
    viewer.cameraTarget = 'auto auto auto';
    viewer.fieldOfView = 'auto';
    await viewer.updateComplete;
    viewer.jumpCameraToGoal();
  }, []);

  const handleFullscreen = async () => {
    try {
      if (document.fullscreenElement === frameRef.current) {
        await document.exitFullscreen();
      } else {
        await frameRef.current.requestFullscreen();
      }
    } catch (_error) {
      setHasFullscreenError(true);
    }
  };

  return (
    <Box data-testid="model-preview" data-status={status}>
      <Frame
        ref={frameRef}
        aria-busy={status === 'loading'}
        data-background={isDarkBackground ? 'dark' : 'light'}
        data-testid="model-preview-frame">
        {!isLoaded && poster && failedPoster !== poster && (
          <Box
            component="img"
            src={poster}
            alt=""
            loading="lazy"
            onError={() => setFailedPoster(poster)}
            data-testid="model-preview-poster"
            sx={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        )}
        {isViewerReady && (
          <Viewer
            key={attempt}
            ref={viewerRef}
            data-testid="model-viewer"
            alt={title}
            camera-controls=""
            camera-orbit="0deg 75deg auto"
            touch-action="pan-y"
            interaction-prompt="none"
            loading="eager">
            {/* The centered overlay above the canvas owns loading feedback. */}
            <span slot="progress-bar" />
          </Viewer>
        )}
        {!isLoaded && (
          <Centered data-testid="model-preview-overlay">
            {status === 'loading' ? (
              <>
                <CircularProgress
                  color="inherit"
                  aria-label={formatMessage({ id: 'Loading ...' })}
                />
                <Typography variant="body2" role="status">
                  {formatMessage({ id: 'Loading ...' })} {progress}%
                </Typography>
              </>
            ) : (
              <>
                {status === 'error' && (
                  <Typography variant="body2" role="alert">
                    {formatMessage({ id: 'Unable to display this 3D model.' })}
                  </Typography>
                )}
                <Button
                  variant="contained"
                  startIcon={<ViewInArIcon />}
                  data-testid="model-preview-start"
                  sx={{
                    width: 'fit-content',
                    borderRadius: 8,
                    px: 3,
                    py: 1.5,
                    textTransform: 'none',
                    boxShadow: 4
                  }}
                  onClick={handleStart}>
                  {formatMessage({
                    id: status === 'error' ? 'Retry' : 'View in 3D'
                  })}
                </Button>
              </>
            )}
          </Centered>
        )}
        {isLoaded && (
          <Controls
            role="group"
            aria-label={title}
            data-testid="model-preview-controls">
            <ControlButton
              label={formatMessage({ id: 'Zoom in' })}
              testId="model-preview-zoom-in"
              onClick={() => viewerRef.current.zoom(3)}>
              <ZoomInIcon />
            </ControlButton>
            <ControlButton
              label={formatMessage({ id: 'Zoom out' })}
              testId="model-preview-zoom-out"
              onClick={() => viewerRef.current.zoom(-3)}>
              <ZoomOutIcon />
            </ControlButton>
            <ControlButton
              label={formatMessage({ id: 'Reset' })}
              testId="model-preview-reset"
              onClick={handleReset}>
              <CenterFocusStrongIcon />
            </ControlButton>
            {document.fullscreenEnabled && !hasFullscreenError && (
              <ControlButton
                label={formatMessage({
                  id: isFullscreen ? 'Exit full screen' : 'Full screen'
                })}
                testId="model-preview-fullscreen"
                onClick={handleFullscreen}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </ControlButton>
            )}
            <ControlButton
              label={formatMessage({
                id: isDarkBackground ? 'Light background' : 'Dark background'
              })}
              testId="model-preview-background"
              onClick={() => setIsDarkBackground(current => !current)}>
              {isDarkBackground ? <LightModeIcon /> : <DarkModeIcon />}
            </ControlButton>
          </Controls>
        )}
      </Frame>
    </Box>
  );
};

const modelPreviewPropTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  poster: PropTypes.string
};

ModelPreviewSession.propTypes = modelPreviewPropTypes;

// A different file starts a fresh session: never show an old model or retain
// its loading/error/background state when API data replaces the source URL.
const ModelPreview = ({ src, title, poster = null }) => (
  <ModelPreviewSession key={src} src={src} title={title} poster={poster} />
);

ModelPreview.propTypes = modelPreviewPropTypes;

export default ModelPreview;
