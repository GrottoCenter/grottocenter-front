import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMap, useMapEvents } from 'react-leaflet';
import { point, setOptions } from 'leaflet';
import PropTypes from 'prop-types';
import { useEntranceFeaturedImage } from '@/hooks';
import FileImage from '@/components/common/DocumentsList/FileImage';
import AppLink from '@/components/common/AppLink';
import { FilePropTypes } from '@/types/document.type';
import { registerPopupImageMap } from '@/utils/mapPopup';

const pointPropType = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.number),
  PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  })
]);

// Reveal text by this deadline, but keep the eager image loading off-layout so
// a slow connection can still complete one later upgrade to the photo layout.
const PREPARATION_TIMEOUT = 2000;

const EntrancePopupContent = ({
  file,
  isPending,
  entranceId,
  entranceName,
  popup
}) => {
  const map = useMap();
  // A text fallback can upgrade once; a completed photo layout stays stable.
  const [presentation, setPresentation] = useState(null);

  useEffect(() => {
    if (presentation) return undefined;
    const timeout = setTimeout(
      () =>
        setPresentation(
          previous =>
            previous ?? { file: null, imageSize: null, isFallback: true }
        ),
      PREPARATION_TIMEOUT
    );
    return () => clearTimeout(timeout);
  }, [presentation]);

  useLayoutEffect(() => {
    if (!presentation && !isPending && !file)
      setPresentation({ file: null, imageSize: null });
  }, [file, isPending, presentation]);

  const isWaitingForPhoto = !presentation || presentation.isFallback;
  const displayedFile = isWaitingForPhoto ? file : presentation.file;
  const displayedSize = presentation?.imageSize;
  const hasPhoto = Boolean(presentation?.file);

  // Size against the map itself, including embedded maps and short screens.
  // Only enable autopan after metadata, image decoding and layout have settled.
  // A resize can still remeasure the same popup without reopening it.
  useLayoutEffect(() => {
    if (!presentation) return undefined;
    const element = popup.getElement();
    const mapContainer = map.getContainer();
    const layout = element.querySelector('.map-popup-entrance');
    const originalMaxHeight = popup.options.maxHeight;
    const originalPaddingTopLeft = popup.options.autoPanPaddingTopLeft;
    const originalPaddingBottomRight = popup.options.autoPanPaddingBottomRight;
    const updatePopup = () => {
      if (!popup.isOpen()) return;
      // Measure immediately, including a late photo upgrade. leaflet-rotate
      // skips autopan during an existing pan, so defer only the next movement.
      if (map.getPane('mapPane').classList.contains('leaflet-pan-anim')) {
        setOptions(popup, { autoPan: false });
        popup.update();
        map.off('moveend', updatePopup);
        map.once('moveend', updatePopup);
      } else {
        setOptions(popup, { autoPan: true });
        popup.update();
      }
      delete element.dataset.entrancePopupPreparing;
      element.removeAttribute('aria-busy');
    };
    const updateLayout = () => {
      if (!popup.isOpen()) return;
      const { x: width, y: height } = map.getSize();
      const bounds = mapContainer.getBoundingClientRect();
      const clippedTopLeft = point(
        Math.max(0, -bounds.left),
        Math.max(0, -bounds.top)
      );
      const clippedBottomRight = point(
        Math.max(0, bounds.right - window.innerWidth),
        Math.max(0, bounds.bottom - window.innerHeight)
      );
      const availableWidth = width - clippedTopLeft.x - clippedBottomRight.x;
      const searchBounds = mapContainer
        .querySelector('input[role="combobox"]')
        ?.getBoundingClientRect();
      const topControlsHeight = searchBounds
        ? Math.max(0, searchBounds.bottom - Math.max(0, bounds.top) + 8)
        : 0;
      const availableHeight =
        height - clippedTopLeft.y - clippedBottomRight.y - topControlsHeight;
      // Keep the close button clear of the map's right-hand controls too.
      const controlsWidth =
        mapContainer
          .querySelector('.leaflet-top.leaflet-right')
          ?.getBoundingClientRect().width ?? 0;
      // Leave room for content margins, the wrapper and autopan padding.
      const contentWidth = Math.max(
        0,
        Math.min(300, availableWidth - controlsWidth - 48)
      );
      element.style.setProperty('--map-popup-width', `${contentWidth}px`);
      element.style.setProperty(
        '--map-popup-photo-height',
        `${Math.min(160, Math.max(0, availableHeight * 0.3))}px`
      );
      if (layout) {
        layout.dataset.photoLayout =
          presentation.imageSize?.height > presentation.imageSize?.width &&
          contentWidth >= 288
            ? 'side'
            : 'top';
      }
      setOptions(popup, {
        maxHeight: Math.max(80, availableHeight - 60),
        autoPanPaddingTopLeft: point(
          originalPaddingTopLeft || popup.options.autoPanPadding
        ).add(clippedTopLeft.add([0, topControlsHeight])),
        autoPanPaddingBottomRight: point(
          originalPaddingBottomRight || popup.options.autoPanPadding
        ).add(clippedBottomRight.add([controlsWidth, 0]))
      });
      updatePopup();
    };
    updateLayout();
    map.on('resize', updateLayout);
    window.addEventListener('resize', updateLayout);
    return () => {
      map.off('resize', updateLayout);
      map.off('moveend', updatePopup);
      window.removeEventListener('resize', updateLayout);
      element.style.removeProperty('--map-popup-width');
      element.style.removeProperty('--map-popup-photo-height');
      if (layout) delete layout.dataset.photoLayout;
      setOptions(popup, {
        maxHeight: originalMaxHeight,
        autoPanPaddingTopLeft: originalPaddingTopLeft,
        autoPanPaddingBottomRight: originalPaddingBottomRight
      });
    };
  }, [map, popup, presentation]);
  if (!displayedFile) return null;

  const handleLoad = ({ currentTarget: image }) => {
    const finish = () => {
      if (!popup.isOpen() || !image.isConnected) return;
      if (!image.naturalWidth || !image.naturalHeight) return;
      setPresentation(previous => {
        if (previous && !previous.isFallback) return previous;
        return {
          file: displayedFile,
          imageSize: {
            width: image.naturalWidth,
            height: image.naturalHeight
          }
        };
      });
    };
    // decode() also covers images already cached by the browser. A decoding
    // failure must not prevent the normal load/error fallback from completing.
    if (image.decode)
      image
        .decode()
        .catch(() => {})
        .then(finish);
    else finish();
  };

  return (
    <AppLink
      to={`/ui/entrances/${entranceId}`}
      className={hasPhoto ? 'map-popup-photo' : undefined}
      hidden={!hasPhoto}
      data-testid="entrance-popup-photo">
      <FileImage
        key={displayedFile.id}
        file={displayedFile}
        alt={entranceName}
        sizes="300px"
        loading="eager"
        onLoad={handleLoad}
        onUnavailable={() => setPresentation({ file: null, imageSize: null })}
        sx={{
          width:
            displayedSize?.width && displayedSize?.height
              ? `min(100%, calc(var(--map-popup-photo-height, 160px) * ${displayedSize.width / displayedSize.height}))`
              : 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: 'var(--map-popup-photo-height, 160px)',
          borderRadius: 2,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.12)',
          objectFit: 'contain',
          display: 'block'
        }}
      />
    </AppLink>
  );
};

EntrancePopupContent.propTypes = {
  file: FilePropTypes,
  isPending: PropTypes.bool.isRequired,
  entranceId: PropTypes.number.isRequired,
  entranceName: PropTypes.string.isRequired,
  popup: PropTypes.shape({
    isOpen: PropTypes.func.isRequired,
    update: PropTypes.func.isRequired,
    getElement: PropTypes.func.isRequired,
    options: PropTypes.shape({
      maxHeight: PropTypes.number,
      autoPanPadding: pointPropType,
      autoPanPaddingTopLeft: pointPropType,
      autoPanPaddingBottomRight: pointPropType
    }).isRequired
  }).isRequired
};

// A single map listener covers marker, search and navigation-target popups.
// React portals keep image error handlers alive inside Leaflet's static HTML.
const EntrancePopupImages = () => {
  const map = useMap();
  const [active, setActive] = useState(null);
  const originalsRef = useRef(new Map());
  useEffect(() => registerPopupImageMap(map), [map]);
  useEffect(() => {
    const originals = originalsRef.current;
    return () => {
      originals.forEach((content, popup) => {
        popup.close();
        popup.setContent(content);
      });
      originals.clear();
    };
  }, []);
  useMapEvents({
    popupopen: ({ popup }) => {
      const slot = popup
        .getElement()
        ?.querySelector('[data-entrance-popup-image]');
      const id = Number(slot?.dataset.entrancePopupImage);
      if (slot && id > 0) {
        // update() re-applies string contents and would destroy the portal.
        // Preserve these DOM nodes while Leaflet measures the photo, and put
        // the original lazy renderer back when the popup closes.
        const contentNode = slot.closest('.leaflet-popup-content');
        const content = document.createElement('div');
        while (contentNode.firstChild)
          content.appendChild(contentNode.firstChild);
        originalsRef.current.set(popup, popup.getContent());
        popup.setContent(content);
      }
      setActive(slot && id > 0 ? { popup, slot, id } : null);
    },
    popupclose: ({ popup }) => {
      setActive(previous => (previous?.popup === popup ? null : previous));
      const original = originalsRef.current.get(popup);
      if (original !== undefined) {
        // popupclose fires while Leaflet still has a map reference. Restoring
        // the lazy content must not start another pan while the popup closes.
        setOptions(popup, { autoPan: false });
        popup.setContent(original);
        originalsRef.current.delete(popup);
      }
    }
  });
  const { data, isPending } = useEntranceFeaturedImage(active?.id);

  if (!active?.popup.isOpen()) return null;
  return createPortal(
    <EntrancePopupContent
      file={data?.featuredFile ?? null}
      isPending={isPending}
      entranceId={active.id}
      entranceName={data?.name ?? ''}
      popup={active.popup}
    />,
    active.slot
  );
};

export default EntrancePopupImages;
