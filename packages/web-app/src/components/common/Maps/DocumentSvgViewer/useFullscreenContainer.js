import { useEffect, useState } from 'react';

// Fullscreen API is unprefixed in modern browsers; keep the webkit fallback for
// older Safari.
const FS_EVENTS = ['fullscreenchange', 'webkitfullscreenchange'];

const getFullscreenElement = () =>
  document.fullscreenElement || document.webkitFullscreenElement || null;

const isRelated = (fsElement, node) =>
  Boolean(
    fsElement &&
    node &&
    (fsElement === node || node.contains(fsElement) || fsElement.contains(node))
  );

/**
 * Resolves the container for MUI Modal/Popover (`container` prop) so menus and
 * dialogs stay visible in fullscreen. Returns the active fullscreen element when
 * it belongs to `ref`'s subtree (leaflet puts `.leaflet-container` fullscreen,
 * a descendant of the viewer wrapper), otherwise null (MUI defaults to
 * document.body). Reactive to enter/exit fullscreen so an already-open
 * dialog/menu follows.
 *
 * @param {{ current: HTMLElement | null }} ref - ref on the viewer wrapper
 * @returns {HTMLElement | null}
 */
const useFullscreenContainer = ref => {
  const [fsElement, setFsElement] = useState(null);

  useEffect(() => {
    const handle = () => setFsElement(getFullscreenElement());
    FS_EVENTS.forEach(evt => document.addEventListener(evt, handle));
    handle();
    return () =>
      FS_EVENTS.forEach(evt => document.removeEventListener(evt, handle));
  }, []);

  return isRelated(fsElement, ref?.current) ? fsElement : null;
};

export default useFullscreenContainer;
