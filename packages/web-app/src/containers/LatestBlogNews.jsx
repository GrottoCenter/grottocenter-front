import PropTypes from 'prop-types';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import NewsCard from '../components/common/card/NewsCard';
import { useLatestBlogNews } from '../hooks';
import { listKeys } from '../api/queryKeys';

const noop = () => {};

const LatestBlogNews = ({ url }) => {
  const queryClient = useQueryClient();
  const { data: news, isPending } = useLatestBlogNews(url);
  // NewsCard runs a setInterval on mount that calls refresh() every N minutes;
  // wire it to a targeted invalidation instead of the legacy dispatch.
  const refresh = useCallback(
    () =>
      queryClient.invalidateQueries({ queryKey: listKeys.latestBlogNews(url) }),
    [queryClient, url]
  );
  return (
    <NewsCard
      showSpinner={isPending}
      day={news?.day}
      month={news?.month}
      title={news?.title}
      text={news?.text}
      linkMore={news?.link}
      init={noop}
      refresh={refresh}
    />
  );
};

LatestBlogNews.propTypes = {
  url: PropTypes.string.isRequired
};

export default LatestBlogNews;
