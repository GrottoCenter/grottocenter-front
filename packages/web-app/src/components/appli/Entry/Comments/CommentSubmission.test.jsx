import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

import { apiGet, apiPost, apiPatch, apiPut } from '@/api/client';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import { personKeys } from '@/api/queryKeys';
import AppSnackbar from '@/components/common/AppSnackbar';
import Comments from './index';
import Comment from './Comment';

vi.mock('@/api/client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPatch: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn()
}));

vi.mock('@/hooks', async () => ({
  ...(await import('@/hooks/mutations/useComment')),
  usePermissions: () => ({ isAuth: true }),
  useUserProperties: () => ({ id: 7 }),
  useOnlineStatus: () => true,
  useIsDesktopLayout: () => true,
  useAnchorScroll: () => {},
  useLanguages: () => ({
    data: [{ id: 'en', refName: 'English' }],
    isSuccess: true
  })
}));

const existingComment = {
  id: 12,
  title: 'Existing comment',
  body: 'Original visit notes.',
  author: { id: 7, nickname: 'Alice' },
  language: 'en',
  isDeleted: false
};

const renderComments = (
  ui = <Comments entranceId={42} comments={[]} isEditAllowed />
) =>
  renderWithProviders(
    <MemoryRouter>
      <SnackbarProvider
        Components={{ success: AppSnackbar, warning: AppSnackbar }}>
        {ui}
      </SnackbarProvider>
    </MemoryRouter>,
    {
      messages,
      preloadedState: {
        intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'en' } } }
      }
    }
  );

const fillComment = () => {
  fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
    target: { value: 'A memorable visit' }
  });
  fireEvent.change(
    screen.getByRole('textbox', { name: /describe your visit/i }),
    {
      target: { value: 'My visit notes.' }
    }
  );
};

const openComment = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Add a new comment' }));
  const option = await screen.findByRole('checkbox', {
    name: 'Also add this entrance to my explored entrances'
  });
  fillComment();
  return option;
};

beforeEach(() => {
  vi.clearAllMocks();
  apiGet.mockResolvedValue({ id: 7, exploredEntrances: [] });
  apiPost.mockResolvedValue({ id: 12 });
  apiPut.mockResolvedValue({});
  apiPatch.mockResolvedValue({ id: 12 });
});

it('validates before publishing and focuses the first invalid field', async () => {
  renderComments();
  fireEvent.click(screen.getByRole('button', { name: 'Add a new comment' }));
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  await waitFor(() =>
    expect(screen.getByRole('textbox', { name: /title/i })).toHaveFocus()
  );
  expect(apiPost).not.toHaveBeenCalled();
  fillComment();
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  expect(await screen.findByText('Comment published.')).toBeVisible();
  expect(screen.getByTestId('app-snackbar')).toHaveTextContent(
    'Comment published.'
  );
  expect(
    within(document.getElementById('comments')).queryByText(
      'Comment published.'
    )
  ).not.toBeInTheDocument();
  expect(apiPost).toHaveBeenCalledTimes(1);
});

it('retains the draft during publication and on failure, then closes after a successful retry', async () => {
  const response = Promise.withResolvers();
  apiPost.mockReturnValueOnce(response.promise);
  renderComments();
  const option = await openComment();
  expect(option).not.toBeChecked();
  const form = screen.getByTestId('comment-form');
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
  expect(form).toHaveAttribute('aria-busy', 'true');
  expect(
    screen.getByRole('button', { name: 'Publish my comment' })
  ).toBeDisabled();
  screen.getAllByRole('button', { name: 'Cancel' }).forEach(button => {
    expect(button).toBeDisabled();
  });
  await act(async () => response.reject(new Error('Publication failed')));
  expect(await screen.findByText('Publication failed')).toBeVisible();
  expect(screen.getByRole('textbox', { name: /title/i })).toHaveValue(
    'A memorable visit'
  );
  expect(
    screen.getByRole('textbox', { name: /describe your visit/i })
  ).toHaveValue('My visit notes.');
  expect(apiPut).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  await waitFor(() =>
    expect(screen.queryByTestId('comment-form')).not.toBeInTheDocument()
  );
  expect(apiPost).toHaveBeenCalledTimes(2);
  expect(apiPut).not.toHaveBeenCalled();
});

it('adds the exploration only after successful publication and retries it without republishing', async () => {
  const response = Promise.withResolvers();
  apiPost.mockReturnValueOnce(response.promise);
  apiPut.mockRejectedValueOnce(new Error('Association failed'));
  renderComments();
  const option = await openComment();
  fireEvent.click(option);
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
  expect(apiPut).not.toHaveBeenCalled();
  await act(async () => response.resolve({ id: 12 }));
  expect(
    await screen.findByText(
      'Comment published, but the entrance could not be added to your explored entrances.'
    )
  ).toBeVisible();
  expect(screen.getAllByTestId('app-snackbar')).toHaveLength(1);
  expect(screen.queryByText('Comment published.')).not.toBeInTheDocument();
  expect(screen.queryByTestId('comment-form')).not.toBeInTheDocument();
  expect(apiPut).toHaveBeenCalledWith(
    expect.stringContaining('/entrances/42/cavers/7')
  );
  const retryResponse = Promise.withResolvers();
  apiPut.mockReturnValueOnce(retryResponse.promise);
  const retryButton = screen.getByRole('button', { name: 'Retry adding' });
  fireEvent.click(retryButton);
  fireEvent.click(retryButton);
  await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(2));
  expect(retryButton).toBeDisabled();
  expect(retryButton).toHaveAttribute('aria-busy', 'true');
  await act(async () => retryResponse.reject(new Error('Still unavailable')));
  expect(retryButton).toBeEnabled();
  fireEvent.click(retryButton);
  await waitFor(() =>
    expect(
      screen.queryByRole('button', { name: 'Retry adding' })
    ).not.toBeInTheDocument()
  );
  expect(apiPost).toHaveBeenCalledTimes(1);
  expect(apiPut).toHaveBeenCalledTimes(3);
});

it('keeps exploration retry dismissible while offline without republishing', async () => {
  apiPut.mockRejectedValueOnce(new Error('Association failed'));
  renderComments();
  fireEvent.click(await openComment());
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  const retryButton = await screen.findByRole('button', {
    name: 'Retry adding'
  });
  try {
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true
      });
      window.dispatchEvent(new Event('offline'));
    });
    expect(retryButton).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByTestId('app-snackbar')).not.toBeInTheDocument()
    );
    expect(apiPost).toHaveBeenCalledTimes(1);
    expect(apiPut).toHaveBeenCalledTimes(1);
  } finally {
    act(() => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true
      });
      window.dispatchEvent(new Event('online'));
    });
  }
});

it('announces complete success only after the selected exploration has been added', async () => {
  const response = Promise.withResolvers();
  apiPut.mockReturnValueOnce(response.promise);
  renderComments();
  fireEvent.click(await openComment());
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  await waitFor(() => expect(apiPut).toHaveBeenCalledTimes(1));
  expect(screen.queryByTestId('app-snackbar')).not.toBeInTheDocument();
  await act(async () => response.resolve({}));
  expect(await screen.findByTestId('app-snackbar')).toHaveTextContent(
    'Comment published.'
  );
  expect(screen.getAllByTestId('app-snackbar')).toHaveLength(1);
});

it('dismisses the exploration warning when the entrance is marked explored elsewhere', async () => {
  apiPut.mockRejectedValueOnce(new Error('Association failed'));
  const { queryClient } = renderComments();
  fireEvent.click(await openComment());
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  expect(
    await screen.findByRole('button', { name: 'Retry adding' })
  ).toBeVisible();
  act(() =>
    queryClient.setQueryData(personKeys.detail(7), {
      id: 7,
      exploredEntrances: [{ id: 42 }]
    })
  );
  await waitFor(() =>
    expect(screen.queryByTestId('app-snackbar')).not.toBeInTheDocument()
  );
  expect(apiPost).toHaveBeenCalledTimes(1);
  expect(apiPut).toHaveBeenCalledTimes(1);
});

it('shows the existing exploration and never offers to add it twice', async () => {
  apiGet.mockResolvedValue({ id: 7, exploredEntrances: [{ id: '42' }] });
  renderComments();
  fireEvent.click(screen.getByRole('button', { name: 'Add a new comment' }));
  expect(
    await screen.findByText('Already in my explored entrances')
  ).toBeVisible();
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  fillComment();
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  expect(await screen.findByText('Comment published.')).toBeVisible();
  expect(apiPut).not.toHaveBeenCalled();
});

it('does not offer exploration before the profile has loaded', async () => {
  const response = Promise.withResolvers();
  apiGet.mockReturnValue(response.promise);
  renderComments();
  fireEvent.click(screen.getByRole('button', { name: 'Add a new comment' }));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(
    screen.queryByText('Already in my explored entrances')
  ).not.toBeInTheDocument();
  await act(async () => response.resolve({ id: 7, exploredEntrances: [] }));
  expect(await screen.findByRole('checkbox')).not.toBeChecked();
});

it('skips adding an exploration that was added elsewhere while drafting', async () => {
  const { queryClient } = renderComments();
  const option = await openComment();
  fireEvent.click(option);
  act(() =>
    queryClient.setQueryData(personKeys.detail(7), {
      id: 7,
      exploredEntrances: [{ id: 42 }]
    })
  );
  expect(
    await screen.findByText('Already in my explored entrances')
  ).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Publish my comment' }));
  expect(await screen.findByText('Comment published.')).toBeVisible();
  expect(apiPut).not.toHaveBeenCalled();
});

it('keeps edits on failure, saves after retry, and shows no exploration controls', async () => {
  const response = Promise.withResolvers();
  apiPatch.mockReturnValueOnce(response.promise);
  renderComments(
    <Comment comment={existingComment} entranceId={42} isEditAllowed />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  expect(
    screen.queryByText('Already in my explored entrances')
  ).not.toBeInTheDocument();
  fillComment();
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(apiPatch).toHaveBeenCalledTimes(1));
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  expect(screen.getByTestId('comment-form')).toHaveAttribute(
    'aria-busy',
    'true'
  );
  await act(async () => response.reject(new Error('Save failed')));
  expect(await screen.findByRole('alert')).toHaveTextContent('Save failed');
  expect(
    screen.getByRole('textbox', { name: /describe your visit/i })
  ).toHaveValue('My visit notes.');
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(screen.queryByTestId('comment-form')).not.toBeInTheDocument()
  );
  expect(apiPatch).toHaveBeenLastCalledWith(
    expect.stringContaining('/comments/12'),
    expect.objectContaining({ body: 'My visit notes.' })
  );
  expect(apiPut).not.toHaveBeenCalled();
});
