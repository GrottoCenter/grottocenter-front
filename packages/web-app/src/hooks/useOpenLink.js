import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

/**
 * Returns a stable callback that navigates in-app on mobile and opens a new
 * tab on desktop.
 *
 * @returns {(url: string) => void}
 *
 * @example
 * const openLink = useOpenLink();
 * <button onClick={() => openLink(`/ui/entrances/${id}`)}>Open</button>
 */
const useOpenLink = () => {
  const navigate = useNavigate();
  return useCallback(
    url => {
      if (isMobile) navigate(url);
      else window.open(url, '_blank');
    },
    [navigate]
  );
};

export default useOpenLink;
