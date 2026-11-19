import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Button, CircularProgress } from '@mui/material';
import ZoomIn from '@mui/icons-material/ZoomIn';
import ZoomOut from '@mui/icons-material/ZoomOut';
import CenterFocusStrong from '@mui/icons-material/CenterFocusStrong';

import {
  PreviewControls,
  PreviewControlButton
} from '@/components/common/MediaPreviewControls';

const PanoramaPreviewSession = ({ src, title }) => {
  const { formatMessage } = useIntl();
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isDisposed = false;
    let viewer;
    const settle = nextStatus => {
      if (isDisposed) {
        // A pending image can finish after destroy() and install listeners again.
        // Keep these callbacks until it settles so those listeners are released.
        viewer.destroy();
        viewer.off('load');
        viewer.off('error');
      } else {
        setStatus(nextStatus);
      }
    };
    const start = async () => {
      try {
        const { createPanoramaViewer } = await import('./pannellum');
        if (isDisposed) return;
        viewer = createPanoramaViewer(containerRef.current, {
          type: 'equirectangular',
          panorama: src,
          autoLoad: true,
          showControls: false,
          compass: false,
          autoRotate: 0,
          escapeHTML: true,
          hfov: 100,
          strings: { loadingLabel: '' }
        });
        viewerRef.current = viewer;
        viewer.on('load', () => settle('ready'));
        viewer.on('error', () => settle('error'));
      } catch (_error) {
        if (!isDisposed) setStatus('error');
      }
    };
    start();
    return () => {
      isDisposed = true;
      viewerRef.current = null;
      viewer?.destroy();
    };
  }, [src, attempt]);

  return (
    <Box
      data-testid="panorama-preview"
      data-status={status}
      aria-busy={status === 'loading'}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        '& .pnlm-load-box, & .pnlm-error-msg': { display: 'none !important' }
      }}>
      <Box
        ref={containerRef}
        role="region"
        aria-label={title}
        sx={{ width: '100%', height: '100%' }}
      />
      {status !== 'ready' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 3,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'common.white'
          }}>
          {status === 'loading' ? (
            <CircularProgress
              color="inherit"
              aria-label={formatMessage({ id: 'Loading ...' })}
            />
          ) : (
            <>
              <Box role="alert">{formatMessage({ id: 'panorama.error' })}</Box>
              <Button
                color="inherit"
                onClick={() => {
                  setStatus('loading');
                  setAttempt(value => value + 1);
                }}>
                {formatMessage({ id: 'Retry' })}
              </Button>
            </>
          )}
        </Box>
      )}
      {status === 'ready' && (
        <PreviewControls
          role="group"
          aria-label={formatMessage({ id: 'panorama.view' })}
          data-testid="panorama-preview-controls"
          sx={{
            zIndex: 2,
            bottom: theme =>
              `calc(var(--panorama-footer-height, 0px) + ${theme.spacing(2)})`,
            bgcolor: 'rgba(0, 0, 0, 0.4)',
            color: 'common.white',
            backdropFilter: 'blur(4px)',
            '& .MuiIconButton-root': { color: 'inherit' }
          }}>
          <PreviewControlButton
            label={formatMessage({ id: 'Zoom in' })}
            testId="panorama-preview-zoom-in"
            onClick={() =>
              viewerRef.current.setHfov(viewerRef.current.getHfov() - 10)
            }>
            <ZoomIn />
          </PreviewControlButton>
          <PreviewControlButton
            label={formatMessage({ id: 'Zoom out' })}
            testId="panorama-preview-zoom-out"
            onClick={() =>
              viewerRef.current.setHfov(viewerRef.current.getHfov() + 10)
            }>
            <ZoomOut />
          </PreviewControlButton>
          <PreviewControlButton
            label={formatMessage({ id: 'Reset' })}
            testId="panorama-preview-reset"
            onClick={() => viewerRef.current.lookAt(0, 0, 100, false)}>
            <CenterFocusStrong />
          </PreviewControlButton>
        </PreviewControls>
      )}
    </Box>
  );
};

const panoramaPreviewPropTypes = {
  src: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

PanoramaPreviewSession.propTypes = panoramaPreviewPropTypes;

const PanoramaPreview = ({ src, title }) => (
  <PanoramaPreviewSession key={src} src={src} title={title} />
);

PanoramaPreview.propTypes = panoramaPreviewPropTypes;

export default PanoramaPreview;
