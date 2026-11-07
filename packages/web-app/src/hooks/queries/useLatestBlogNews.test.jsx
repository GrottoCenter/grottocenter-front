import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import { apiGet } from '@/api/client';
import { DYNAMIC_NEWS_RELOAD_INTERVAL } from '@/conf/config';
import { createTestQueryClient } from '@/test/renderWithProviders';
import { useLatestBlogNews } from './useHomepageLists';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));

const englishFeed = 'https://api.example.org/api/rss/EN';
const frenchFeed = 'https://api.example.org/api/rss/FR';
const article = {
  title: 'Community news',
  text: 'Latest activities',
  image: 'https://images.example.org/article.jpg'
};

let queryClient;
const Wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

beforeEach(() => {
  vi.resetAllMocks();
  queryClient = createTestQueryClient();
});

afterEach(() => {
  queryClient.clear();
  vi.useRealTimers();
});

it('refreshes automatically at the configured interval and stops after unmount', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const nextArticle = { ...article, title: 'New article' };
  apiGet.mockResolvedValueOnce(article).mockResolvedValue(nextArticle);
  const { result, unmount } = renderHook(() => useLatestBlogNews(englishFeed), {
    wrapper: Wrapper
  });

  await waitFor(() => expect(result.current.data).toEqual(article));
  expect(apiGet).toHaveBeenCalledTimes(1);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(DYNAMIC_NEWS_RELOAD_INTERVAL);
  });
  await waitFor(() => expect(result.current.data).toEqual(nextArticle));
  expect(apiGet).toHaveBeenCalledTimes(2);

  unmount();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(DYNAMIC_NEWS_RELOAD_INTERVAL);
  });
  expect(apiGet).toHaveBeenCalledTimes(2);
});

it('retains the article after a failed refresh and recovers on the next refresh', async () => {
  const nextArticle = { ...article, title: 'New article', image: null };
  apiGet
    .mockResolvedValueOnce(article)
    .mockRejectedValueOnce(new Error('Blog unavailable'))
    .mockResolvedValue(nextArticle);
  const { result } = renderHook(() => useLatestBlogNews(englishFeed), {
    wrapper: Wrapper
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(article);
  expect(apiGet).toHaveBeenCalledTimes(1);

  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(result.current.isPending).toBe(false);
  expect(result.current.data).toEqual(article);

  await act(async () => {
    await result.current.refetch();
  });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(nextArticle);
  expect(apiGet).toHaveBeenCalledTimes(3);
});

it('keeps each language in its own cache when changing the feed', async () => {
  const frenchArticle = { ...article, title: 'Actualités' };
  apiGet.mockImplementation(async url =>
    url === frenchFeed ? frenchArticle : article
  );
  const { result, rerender } = renderHook(({ url }) => useLatestBlogNews(url), {
    initialProps: { url: englishFeed },
    wrapper: Wrapper
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toEqual(article);

  rerender({ url: frenchFeed });
  await waitFor(() => expect(result.current.data).toEqual(frenchArticle));

  rerender({ url: englishFeed });
  expect(result.current.data).toEqual(article);
  expect(apiGet).toHaveBeenCalledTimes(2);
});
