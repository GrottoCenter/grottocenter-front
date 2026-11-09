import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useMap, useMapEvents } from 'react-leaflet';
import { point, setOptions } from 'leaflet';
import PropTypes from 'prop-types';
import { entranceQueryOptions } from '@/api/entranceQueryOptions';
import FileImage from '@/components/common/DocumentsList/FileImage';
import AppLink from '@/components/common/AppLink';
import { FilePropTypes } from '@/types/document.type';

const pointPropType = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.number),
  PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired
  })
]);

const EntrancePopupContent = ({ file, entranceId, entranceName, popup }) => {
  const map = useMap();
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [imageSize, setImageSize] = useState(null);

  // Size against the map itself, including embedded maps and short screens.
  // update() keeps Leaflet's existing positioning/autopan after the portal,
  // image orientation or map dimensions change, without reopening a popup.
  useLayoutEffect(() => {
    const element = popup.getElement();
    const mapContainer = map.getContainer();
    const layout = element.querySelector('.map-popup-entrance');
    const originalMaxHeight = popup.options.maxHeight;
    const originalPaddingTopLeft = popup.options.autoPanPaddingTopLeft;
    const originalPaddingBottomRight = popup.options.autoPanPaddingBottomRight;
    const updatePopup = () => {
      if (!popup.isOpen()) return;
      // leaflet-rotate skips autopan while a previous pan is running. Measure
      // the final image after that movement, so it cannot remain offscreen.
      if (map.getPane('mapPane').classList.contains('leaflet-pan-anim')) {
        map.off('moveend', updatePopup);
        map.once('moveend', updatePopup);
      } else {
        popup.update();
      }
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
          imageSize?.height > imageSize?.width && contentWidth >= 288
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
  }, [map, popup, imageSize, isUnavailable]);
  if (!file || isUnavailable) return null;

  return (
    <AppLink
      to={`/ui/entrances/${entranceId}`}
      className="map-popup-photo"
      data-testid="entrance-popup-photo">
      <FileImage
        file={file}
        alt={entranceName}
        sizes="300px"
        loading="eager"
        onLoad={({ currentTarget }) =>
          setImageSize({
            width: currentTarget.naturalWidth,
            height: currentTarget.naturalHeight
          })
        }
        onUnavailable={() => setIsUnavailable(true)}
        sx={{
          width:
            imageSize?.width && imageSize?.height
              ? `min(100%, calc(var(--map-popup-photo-height, 160px) * ${imageSize.width / imageSize.height}))`
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
  const [active, setActive] = useState(null);
  const originalsRef = useRef(new Map());
  useEffect(() => {
    const originals = originalsRef.current;
    return () => {
      originals.forEach((content, popup) => popup.setContent(content));
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
        popup.setContent(original);
        originalsRef.current.delete(popup);
      }
    }
  });
  // Temporary trade-off: uncached popups fetch full entrance detail. The shared
  // five-minute cache avoids repeated fresh reads and preloads the entrance page.
  // Replace this with the lightweight featured-image API once deployed:
  // backend: GrottoCenter/grottocenter-api#1992
  // frontend: GrottoCenter/grottocenter-front#1619
  const { data } = useQuery({
    ...entranceQueryOptions(active?.id),
    meta: { skipErrorNotification: true }
  });

  if (!active?.popup.isOpen()) return null;
  return createPortal(
    <EntrancePopupContent
      key={`${active.id}-${data?.featuredFile?.id ?? 'no-photo'}`}
      file={data?.featuredFile ?? null}
      entranceId={active.id}
      entranceName={data?.name ?? ''}
      popup={active.popup}
    />,
    active.slot
  );
};

export default EntrancePopupImages;
