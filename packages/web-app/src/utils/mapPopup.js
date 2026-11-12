import { popup as leafletPopup, setOptions } from 'leaflet';

const imageManagedMaps = new WeakSet();

export const registerPopupImageMap = map => {
  imageManagedMaps.add(map);
  return () => imageManagedMaps.delete(map);
};

// The first contentupdate of each opening exposes the DOM before Leaflet's
// layout/autopan. popupopen is too late; later updates must not hide it again.
export const createMapPopup = (content, map) => {
  const popup = leafletPopup().setContent(content);
  const prepare = () => {
    // Form maps deliberately keep their text-only popups. Only a registered
    // image manager can complete preparation and reveal the popup again.
    if (!imageManagedMaps.has(map)) return;
    const element = popup.getElement();
    const slot = element.querySelector('[data-entrance-popup-image]');
    if (Number(slot?.dataset.entrancePopupImage) > 0) {
      setOptions(popup, { autoPan: false });
      element.dataset.entrancePopupPreparing = 'true';
      element.setAttribute('aria-busy', 'true');
    }
  };
  popup.once('contentupdate', prepare);
  popup.on('remove', () => popup.once('contentupdate', prepare));
  return popup;
};
