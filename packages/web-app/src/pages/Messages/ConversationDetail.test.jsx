import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';

import * as apiClient from '@/api/client';
import { messageKeys } from '@/api/queryKeys';
import { getConversationMessagesUrl, postMessageUrl } from '@/conf/apiRoutes';
import { renderWithProviders } from '@/test/renderWithProviders';
import ConversationDetail from './ConversationDetail';

const translations = {
  Send: 'Send',
  close: 'Close',
  'Conversation details': 'Conversation details',
  'Type a message...': 'Type a message...',
  'Failed to send message.': 'Failed to send message.'
};
const makeMessage = (id, body = `Message ${id}`) => ({
  id,
  body,
  dateSent: '2026-10-05T12:00:00.000Z',
  caverSender: { id: 1, nickname: 'Me' }
});
const headKey = messageKeys.messages('7', { skip: 0, pageSize: 20 });
const originalScrollIntoView = Element.prototype.scrollIntoView;
let serverMessages;
let apiPost;
let apiGetWithRange;

const renderConversation = () =>
  renderWithProviders(
    <SnackbarProvider>
      <MemoryRouter initialEntries={['/ui/messages/7']}>
        <Routes>
          <Route
            path="/ui/messages/:conversationId"
            element={<ConversationDetail />}
          />
        </Routes>
      </MemoryRouter>
    </SnackbarProvider>,
    {
      preloadedState: {
        login: { authTokenDecoded: { id: 1, nickname: 'Me' } }
      },
      messages: translations
    }
  );

const enterReply = (body = 'New reply') => {
  const input = screen.getByRole('textbox');
  fireEvent.change(input, { target: { value: body } });
  return input;
};

const pressEnter = input => fireEvent.keyDown(input, { key: 'Enter' });

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  serverMessages = Array.from({ length: 25 }, (_, index) =>
    makeMessage(25 - index)
  );
  apiGetWithRange = vi
    .spyOn(apiClient, 'apiGetWithRange')
    .mockImplementation(async url => {
      const parsedUrl = new URL(url, 'http://localhost');
      if (parsedUrl.pathname.endsWith('/messages/conversations/7')) {
        const skip = Number(parsedUrl.searchParams.get('skip'));
        const limit = Number(parsedUrl.searchParams.get('limit'));
        return {
          data: { messages: serverMessages.slice(skip, skip + limit) },
          contentRange: `messages ${skip}-${skip + limit - 1}/${serverMessages.length}`
        };
      }
      return { data: { conversations: [] }, contentRange: 'conversations */0' };
    });
  apiPost = vi
    .spyOn(apiClient, 'apiPost')
    .mockImplementation(async (_url, { body }) => {
      const sent = makeMessage(26, body);
      serverMessages = [sent, ...serverMessages];
      return sent;
    });
});

afterEach(() => {
  vi.restoreAllMocks();
  if (originalScrollIntoView) {
    Element.prototype.scrollIntoView = originalScrollIntoView;
  } else {
    delete Element.prototype.scrollIntoView;
  }
});

it.each(['Enter', 'Send button'])(
  'keeps the refreshed head visible after sending with %s',
  async trigger => {
    renderConversation();
    await screen.findByText('Message 25');
    const input = enterReply();
    if (trigger === 'Enter') pressEnter(input);
    else fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await screen.findByText('New reply');
    await waitFor(() => expect(input).toHaveValue(''));
    expect(screen.getByText('Message 25')).toBeVisible();
    expect(apiPost).toHaveBeenCalledExactlyOnceWith(postMessageUrl, {
      conversationId: 7,
      body: 'New reply'
    });
    fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await screen.findByText('Message 1');
    expect(screen.getByText('New reply')).toBeVisible();
  }
);

it('preserves the head and working pagination when the refetch is unchanged', async () => {
  const { queryClient } = renderConversation();
  await screen.findByText('Message 25');
  const cachedHead = queryClient.getQueryData(headKey);
  // Model a successful POST followed by a GET that still returns the same
  // snapshot. Structural sharing then preserves the pageData dependency.
  apiPost.mockResolvedValueOnce(makeMessage(26, 'New reply'));
  const input = enterReply();
  pressEnter(input);

  await waitFor(() => expect(input).toHaveValue(''));
  expect(queryClient.getQueryData(headKey)).toBe(cachedHead);
  expect(screen.getByText('Message 25')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Message 1');
  expect(screen.getByText('Message 25')).toBeVisible();
});

it('returns to the refreshed head after sending from an older page', async () => {
  renderConversation();
  await screen.findByText('Message 25');
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Message 1');
  const input = enterReply();
  pressEnter(input);

  await screen.findByText('New reply');
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
  expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
  expect(screen.getAllByText('Message 25')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Message 1');
  expect(screen.getAllByText('Message 6')).toHaveLength(1);
});

it('returns to the head when pagination advances during the pending POST', async () => {
  renderConversation();
  await screen.findByText('Message 25');
  let finishPost;
  apiPost.mockImplementationOnce(
    () =>
      new Promise(resolve => {
        finishPost = resolve;
      })
  );
  const input = enterReply();
  pressEnter(input);
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
  fireEvent.click(screen.getByRole('button', { name: 'Load more' }));
  await screen.findByText('Message 1');

  const sent = makeMessage(26, 'New reply');
  serverMessages = [sent, ...serverMessages];
  await act(async () => finishPost(sent));

  await screen.findByText('New reply');
  await waitFor(() => expect(screen.getByRole('textbox')).toHaveValue(''));
  expect(screen.queryByText('Message 1')).not.toBeInTheDocument();
  const messageRequests = apiGetWithRange.mock.calls.filter(([url]) =>
    url.startsWith(`${getConversationMessagesUrl('7')}?`)
  );
  expect(messageRequests.at(-1)[0]).toBe(
    `${getConversationMessagesUrl('7')}?limit=20&skip=0`
  );
});

it('ignores repeated Enter presses before pending state renders', async () => {
  renderConversation();
  await screen.findByText('Message 25');
  let finishPost;
  apiPost.mockImplementation(
    () =>
      new Promise(resolve => {
        finishPost = resolve;
      })
  );
  const input = enterReply();
  act(() => {
    pressEnter(input);
    pressEnter(input);
  });
  await waitFor(() => expect(apiPost).toHaveBeenCalledTimes(1));
  pressEnter(input);
  expect(apiPost).toHaveBeenCalledTimes(1);

  const sent = makeMessage(26, 'New reply');
  serverMessages = [sent, ...serverMessages];
  await act(async () => finishPost(sent));
  await screen.findByText('New reply');
  await waitFor(() => expect(input).toHaveValue(''));
  expect(apiPost).toHaveBeenCalledTimes(1);
});

it('keeps the draft and allows a retry after a failed send', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  renderConversation();
  await screen.findByText('Message 25');
  apiPost.mockRejectedValueOnce(new Error('Send failed'));
  const input = enterReply();
  pressEnter(input);
  await screen.findByText('Failed to send message.');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
  );
  expect(input).toHaveValue('New reply');
  expect(screen.getByText('Message 25')).toBeVisible();
  pressEnter(input);
  await screen.findByText('New reply');
  await waitFor(() => expect(input).toHaveValue(''));
  expect(apiPost).toHaveBeenCalledTimes(2);
});
