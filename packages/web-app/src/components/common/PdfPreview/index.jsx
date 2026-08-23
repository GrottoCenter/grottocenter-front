import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, CircularProgress, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from '@mui/icons-material';
// `?url` keeps the 1.2 MB worker out of the bundle graph: Vite emits it as a
// hashed asset and this import is just the string. It is only ever fetched when
// a Worker is constructed, i.e. when the fallback viewer actually runs.
import PDF_WORKER_URL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { useMeasuredWidth } from '@/hooks';
import { hasNativePdfViewer } from '@/utils/pdfViewerSupport';
import AppLink from '../AppLink';

const FRAME_HEIGHTS = { xs: 320, sm: 480, md: 600 };
const PDFJS_ASSET_BASE_URL = `${import.meta.env.BASE_URL}assets/pdfjs`;

// Zoom is a multiple of "fit to container width", so 1 always means the page
// spans the frame whatever the screen. Below that there is nothing to gain —
// the page would just get smaller inside an already small box.
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

// Above 2 the extra bitmap costs memory (×dpr² per page) for a difference no
// one can see. Phones with dpr 3 are exactly the devices with the least room.
const MAX_PIXEL_RATIO = 2;

// Same outline as the `FileRow` entries the other attachments render as, so a
// PDF reads as one more item in the files list rather than a bleeding block of
// grey: 1px divider, 4px radius. `overflow: hidden` is what makes the radius
// visible — without it the square canvas paints over the rounded corners.
const Frame = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: FRAME_HEIGHTS.xs,
  background: theme.palette.grey[100],
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(0.5),
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: { height: FRAME_HEIGHTS.sm },
  [theme.breakpoints.up('md')]: { height: FRAME_HEIGHTS.md }
}));

const NativeViewer = styled('object')({
  border: 0,
  width: '100%',
  height: '100%',
  display: 'block'
});

// `touchAction: 'pan-x pan-y'` so a zoomed page can be dragged in both
// directions without the browser claiming the gesture for page scrolling.
const Scroller = styled('div')({
  width: '100%',
  height: '100%',
  overflow: 'auto',
  touchAction: 'pan-x pan-y',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start'
});

const Centered = styled('div')({
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: 16
});

const Toolbar = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: theme.spacing(1),
  flexWrap: 'wrap',
  padding: theme.spacing(0.5, 0)
}));

const ControlGroup = styled('div')({
  display: 'flex',
  alignItems: 'center'
});

/**
 * PDF.js viewer: renders one page at a time onto a canvas.
 *
 * Used wherever the browser has no native PDF plugin — see `hasNativePdfViewer`.
 * One page at a time rather than a continuous scroll because a scanned
 * cave-survey collection can run to hundreds of pages, and each rendered page
 * is a full-size bitmap held in memory.
 */
const PdfJsViewer = ({ src }) => {
  const { formatMessage } = useIntl();
  const [scrollerRef, frameWidth] = useMeasuredWidth();
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let loadingTask = null;
    setPdf(null);
    setPageNumber(1);
    setZoom(MIN_ZOOM);
    setHasError(false);

    const load = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        // Idempotent, and cheap enough not to be worth guarding: the worker is
        // spawned by getDocument, not by this assignment.
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
        if (isCancelled) return;
        // PDF.js 6 decodes formats such as JBIG2 and JPEG 2000 through assets
        // loaded by fixed filename from this directory. Without it, rendering
        // succeeds with the undecodable images silently missing.
        loadingTask = pdfjs.getDocument({
          url: src,
          wasmUrl: `${PDFJS_ASSET_BASE_URL}/${pdfjs.version}/wasm/`
        });
        if (isCancelled) {
          loadingTask.destroy();
          return;
        }
        const doc = await loadingTask.promise;
        if (isCancelled) return;
        setPdf(doc);
        setPageCount(doc.numPages);
      } catch (_error) {
        // Every failure mode lands here — network, CORS, password-protected or
        // corrupt file — and they all mean the same thing to the reader: no
        // preview. The "Open PDF" link stays as the way out.
        if (!isCancelled) setHasError(true);
      }
    };
    load();

    return () => {
      isCancelled = true;
      // Tears down the document AND its worker; destroying the task is the
      // documented way to release both.
      loadingTask?.destroy();
    };
  }, [src]);

  useEffect(() => {
    if (!pdf || !frameWidth) return undefined;
    let isCancelled = false;

    const render = async () => {
      const page = await pdf.getPage(pageNumber);
      if (isCancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const unscaled = page.getViewport({ scale: 1 });
      const cssScale = (frameWidth / unscaled.width) * zoom;
      const pixelRatio = Math.min(
        window.devicePixelRatio || 1,
        MAX_PIXEL_RATIO
      );
      const viewport = page.getViewport({ scale: cssScale * pixelRatio });

      // The bitmap is sized in device pixels and the element in CSS pixels, so
      // the page stays sharp on a high-density screen.
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
      canvas.style.height = `${Math.floor(viewport.height / pixelRatio)}px`;

      renderTaskRef.current = page.render({ canvas, viewport });
      try {
        await renderTaskRef.current.promise;
      } catch (error) {
        // Expected whenever the effect re-runs mid-render (page turn, zoom,
        // resize): the previous task is cancelled below and rejects here.
        if (error?.name !== 'RenderingCancelledException') setHasError(true);
      }
    };
    render();

    return () => {
      isCancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [pdf, pageNumber, zoom, frameWidth]);

  const goToPage = useCallback(
    offset => setPageNumber(current => current + offset),
    []
  );
  const changeZoom = useCallback(
    offset =>
      setZoom(current =>
        Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current + offset))
      ),
    []
  );

  if (hasError) {
    return (
      <Frame>
        <Centered>
          <Typography variant="body2" color="text.secondary">
            {formatMessage({ id: 'Unable to display this PDF.' })}
          </Typography>
          <Typography variant="body2">
            <AppLink href={src}>{formatMessage({ id: 'Open PDF' })}</AppLink>
          </Typography>
        </Centered>
      </Frame>
    );
  }

  return (
    <Box>
      <Frame>
        <Scroller ref={scrollerRef}>
          <Box
            component="canvas"
            ref={canvasRef}
            role="img"
            aria-label={formatMessage(
              { id: 'Page {current} of {total}' },
              { current: pageNumber, total: pageCount }
            )}
            sx={{ display: pdf ? 'block' : 'none' }}
          />
        </Scroller>
        {!pdf && (
          <Centered>
            <CircularProgress size={32} />
          </Centered>
        )}
      </Frame>
      {pdf && (
        <Toolbar>
          <ControlGroup>
            <IconButton
              size="small"
              disabled={pageNumber <= 1}
              onClick={() => goToPage(-1)}
              aria-label={formatMessage({ id: 'Previous page' })}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {formatMessage(
                { id: 'Page {current} of {total}' },
                { current: pageNumber, total: pageCount }
              )}
            </Typography>
            <IconButton
              size="small"
              disabled={pageNumber >= pageCount}
              onClick={() => goToPage(1)}
              aria-label={formatMessage({ id: 'Next page' })}>
              <ChevronRight />
            </IconButton>
          </ControlGroup>
          <ControlGroup>
            <IconButton
              size="small"
              disabled={zoom <= MIN_ZOOM}
              onClick={() => changeZoom(-ZOOM_STEP)}
              aria-label={formatMessage({ id: 'Zoom out' })}>
              <ZoomOut />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {`${Math.round(zoom * 100)}%`}
            </Typography>
            <IconButton
              size="small"
              disabled={zoom >= MAX_ZOOM}
              onClick={() => changeZoom(ZOOM_STEP)}
              aria-label={formatMessage({ id: 'Zoom in' })}>
              <ZoomIn />
            </IconButton>
          </ControlGroup>
        </Toolbar>
      )}
    </Box>
  );
};

PdfJsViewer.propTypes = {
  src: PropTypes.string.isRequired
};

/**
 * Inline PDF preview.
 *
 * Hands the file to the browser's own viewer when there is one — it beats
 * anything we can build (text search, selection, printing, ranged loading) —
 * and falls back to rendering the pages ourselves with PDF.js everywhere else,
 * which in practice means every phone and tablet.
 */
const PdfPreview = ({ src }) => {
  const { formatMessage } = useIntl();
  // Read once per mount: neither the platform nor the plugin registry changes
  // under a live page, and re-reading it on every render would re-mount the
  // viewer if it ever did.
  const [isNativeViewerUsed] = useState(hasNativePdfViewer);

  if (!isNativeViewerUsed) return <PdfJsViewer src={src} />;

  return (
    <Frame>
      <NativeViewer data={src} type="application/pdf">
        <Typography variant="body2">
          <AppLink href={src}>{formatMessage({ id: 'Open PDF' })}</AppLink>
        </Typography>
      </NativeViewer>
    </Frame>
  );
};

PdfPreview.propTypes = {
  src: PropTypes.string.isRequired
};

export default PdfPreview;
