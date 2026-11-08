import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';
import { entranceQueryOptions } from '@/api/entranceQueryOptions';
import FileImage from '@/components/common/DocumentsList/FileImage';
import AppLink from '@/components/common/AppLink';
import { FilePropTypes } from '@/types/document.type';

const PopupPhoto = ({ file, entranceId, entranceName, popup }) => {
  const [isUnavailable, setIsUnavailable] = useState(false);
  // Leaflet measures serialized HTML before the portal exists. Re-measure its
  // fixed-height photo after insertion/removal without opening a closed popup.
  useEffect(() => {
    if (popup.isOpen()) popup.update();
  }, [popup, isUnavailable]);
  if (isUnavailable) return null;

  return (
    <AppLink to={`/ui/entrances/${entranceId}`} className="map-popup-photo">
      <FileImage
        file={file}
        alt={entranceName}
        sizes="260px"
        loading="eager"
        onUnavailable={() => setIsUnavailable(true)}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block'
        }}
      />
    </AppLink>
  );
};

PopupPhoto.propTypes = {
  file: FilePropTypes.isRequired,
  entranceId: PropTypes.number.isRequired,
  entranceName: PropTypes.string.isRequired,
  popup: PropTypes.shape({ isOpen: PropTypes.func, update: PropTypes.func })
    .isRequired
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
        const contentNode = slot.parentElement;
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
  const { data } = useQuery({
    ...entranceQueryOptions(active?.id),
    meta: { skipErrorNotification: true }
  });

  if (!active?.popup.isOpen() || !data?.featuredFile) return null;
  return createPortal(
    <PopupPhoto
      key={`${active.id}-${data.featuredFile.id}`}
      file={data.featuredFile}
      entranceId={active.id}
      entranceName={data.name ?? ''}
      popup={active.popup}
    />,
    active.slot
  );
};

export default EntrancePopupImages;
