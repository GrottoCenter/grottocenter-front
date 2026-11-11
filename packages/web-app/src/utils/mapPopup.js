import { popup as leafletPopup, setOptions } from 'leaflet';

// The first contentupdate of each opening exposes the DOM before Leaflet's
// layout/autopan. popupopen is too late; later updates must not hide it again.
export const createMapPopup = content => {
  const popup = leafletPopup().setContent(content);
  const prepare = () => {
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
