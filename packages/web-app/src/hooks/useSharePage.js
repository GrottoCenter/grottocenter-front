import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { isMobile } from 'react-device-detect';
import copyToClipboard from '../helpers/clipboard';
import { useNotification } from './useNotification';

const useSharePage = () => {
  const { formatMessage } = useIntl();
  const { onSuccess } = useNotification();

  return useCallback(async () => {
    const { origin, pathname } = window.location;
    const url = origin + pathname;
    const shareTitle = document.title;
    if (navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch (err) {
        if (err.name !== 'AbortError') {
          await copyToClipboard(url);
          onSuccess(formatMessage({ id: 'Link copied!' }));
        }
      }
    } else {
      await copyToClipboard(url);
      if (!isMobile) {
        onSuccess(formatMessage({ id: 'Link copied!' }));
      }
    }
  }, [formatMessage, onSuccess]);
};

export default useSharePage;
