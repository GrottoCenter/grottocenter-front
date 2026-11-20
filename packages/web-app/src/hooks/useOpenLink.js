import { useCallback } from 'react';
import { useHref, useNavigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

/**
 * Returns a stable callback that navigates in-app on mobile and opens a new
 * tab on desktop.
 *
 * Use this for imperative navigation (button/list-item onClick handlers). For
 * declarative links, prefer the `AppLink` component.
 *
 * @returns {(url: string) => void}
 *
 * @example
 * const openLink = useOpenLink();
 * <button onClick={() => openLink(`/ui/entrances/${id}`)}>Open</button>
 */
const useOpenLink = () => {
  const navigate = useNavigate();
  const routerBaseHref = useHref('/');
  return useCallback(
    url => {
      if (isMobile) navigate(url);
      else {
        const basePath = routerBaseHref.replace(/\/$/, '');
        const href = url.startsWith('/') ? `${basePath}${url}` : url;
        window.open(href, '_blank');
      }
    },
    [navigate, routerBaseHref]
  );
};

export default useOpenLink;
