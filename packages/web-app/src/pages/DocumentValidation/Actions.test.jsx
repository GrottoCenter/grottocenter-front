import {
  act,
  fireEvent,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { apiPut } from '@/api/client';
import { useNotification } from '@/hooks';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import Actions from './Actions';

vi.mock('@/api/client', () => ({ apiPut: vi.fn() }));
vi.mock('@/hooks/useNotification', () => ({ useNotification: vi.fn() }));

const notifySuccess = vi.fn();
const notifyWarning = vi.fn();
const notifyError = vi.fn();
const documents = [
  { id: 7, title: 'First document' },
  { id: 8, title: 'Second document' }
];
const submit = () => {
  fireEvent.click(screen.getByTestId('batch-validate'));
  fireEvent.click(screen.getByTestId('confirm-process-documents'));
};

beforeEach(() => {
  vi.clearAllMocks();
  useNotification.mockReturnValue({
    onSuccess: notifySuccess,
    onWarning: notifyWarning,
    onError: notifyError
  });
});

describe('document moderation actions', () => {
  it('reports a completed request even if the action component unmounts', async () => {
    let resolve;
    apiPut.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    const onProcessed = vi.fn();
    const onDraftChange = vi.fn();
    const { unmount } = renderWithProviders(
      <Actions
        selectedIds={[7]}
        onEdit={vi.fn()}
        onProcessed={onProcessed}
        onDraftChange={onDraftChange}
        draft={{ isValidated: true, comment: '' }}
      />,
      { messages }
    );
    submit();
    unmount();
    await act(async () =>
      resolve([{ id: 7, status: 'error', reason: 'Internal error' }])
    );
    await waitFor(() => expect(onProcessed).toHaveBeenCalledTimes(1));
    expect(onDraftChange).toHaveBeenLastCalledWith({
      isValidated: true,
      comment: ''
    });
  });

  it('uses the submitted IDs and titles when selection changes during a mixed batch', async () => {
    let resolve;
    apiPut.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    const onProcessed = vi.fn();
    const { rerender } = renderWithProviders(
      <Actions
        selectedIds={[7, 8]}
        documents={documents}
        onEdit={vi.fn()}
        onProcessed={onProcessed}
      />,
      { messages }
    );
    submit();
    rerender(
      <Actions
        selectedIds={[99]}
        documents={[]}
        onEdit={vi.fn()}
        onProcessed={onProcessed}
      />
    );
    await act(async () =>
      resolve([
        { id: 7, status: 'validated', reason: null },
        { id: 8, status: 'error', reason: 'Technical error' }
      ])
    );
    await waitFor(() => expect(onProcessed).toHaveBeenCalledTimes(1));
    expect(notifySuccess).not.toHaveBeenCalled();
    expect(notifyError).toHaveBeenCalledWith(
      '1 document validated, 1 document failed'
    );
    expect(onProcessed.mock.calls[0][0]).toEqual([
      { id: 7, status: 'validated', reason: null, title: 'First document' },
      {
        id: 8,
        status: 'error',
        reason: 'Technical error',
        title: 'Second document'
      }
    ]);
  });

  it('does not overwrite a new controlled draft when an earlier submission fails', async () => {
    let resolve;
    apiPut.mockReturnValue(
      new Promise(done => {
        resolve = done;
      })
    );
    const onDraftChange = vi.fn();
    const onProcessed = vi.fn();
    const { rerender } = renderWithProviders(
      <Actions
        selectedIds={[7]}
        onEdit={vi.fn()}
        onProcessed={onProcessed}
        draft={{ isValidated: false, comment: 'Wrong author' }}
        onDraftChange={onDraftChange}
      />,
      { messages }
    );
    fireEvent.click(screen.getByTestId('batch-decline'));
    fireEvent.click(screen.getByTestId('confirm-process-documents'));
    onDraftChange.mockClear();
    rerender(
      <Actions
        selectedIds={[8]}
        onEdit={vi.fn()}
        onProcessed={onProcessed}
        draft={{ isValidated: true, comment: 'New draft' }}
        onDraftChange={onDraftChange}
      />
    );
    await act(async () => resolve([{ id: 7, status: 'error' }]));
    await waitFor(() => expect(onProcessed).toHaveBeenCalledTimes(1));
    expect(onDraftChange).not.toHaveBeenCalled();
    expect(onProcessed.mock.calls[0][1]).toMatchObject({
      ids: [7],
      isValidated: false,
      comment: 'Wrong author'
    });
  });

  it('distinguishes auto rejection and not found on a successful response', async () => {
    apiPut.mockResolvedValue([
      { id: 7, status: 'auto_rejected', reason: '<b>Invalid attachment</b>' },
      { id: 8, status: 'not_found', reason: null }
    ]);
    renderWithProviders(<Actions selectedIds={[7, 8]} onEdit={vi.fn()} />, {
      messages
    });
    submit();
    await waitFor(() =>
      expect(notifyWarning).toHaveBeenCalledWith(
        '1 document automatically rejected, 1 document not found'
      )
    );
    expect(notifySuccess).not.toHaveBeenCalled();
  });

  it.each(['network', 'invalid', 'missing'])(
    'retains submitted action and comment for an indeterminate %s result',
    async mode => {
      if (mode === 'network')
        apiPut.mockRejectedValue(new TypeError('Network'));
      else apiPut.mockResolvedValue(mode === 'invalid' ? {} : []);
      const onProcessed = vi.fn();
      renderWithProviders(
        <Actions
          selectedIds={[7]}
          onEdit={vi.fn()}
          onProcessed={onProcessed}
        />,
        { messages }
      );
      fireEvent.click(screen.getByTestId('batch-decline'));
      const confirmation = screen.getByTestId('confirm-process-documents');
      fireEvent.change(
        within(confirmation.closest('[role="dialog"]')).getByRole('textbox'),
        { target: { value: 'Wrong author' } }
      );
      fireEvent.click(confirmation);
      await waitFor(() => expect(onProcessed).toHaveBeenCalledTimes(1));
      expect(onProcessed.mock.calls[0][0][0].status).toBe('indeterminate');
      fireEvent.click(screen.getByTestId('batch-decline'));
      expect(screen.getByRole('textbox')).toHaveValue('Wrong author');
      expect(apiPut).toHaveBeenCalledTimes(1);
      expect(notifySuccess).not.toHaveBeenCalled();
    }
  );

  it.each([
    [400, 'processDocumentsBadRequest'],
    [403, 'processDocumentsForbidden']
  ])(
    'reports HTTP %i as a certain refusal and preserves the draft',
    async (status, messageId) => {
      apiPut.mockRejectedValue({ status });
      const onProcessed = vi.fn();
      renderWithProviders(
        <Actions
          selectedIds={[7]}
          onEdit={vi.fn()}
          onProcessed={onProcessed}
        />,
        { messages }
      );
      fireEvent.click(screen.getByTestId('batch-decline'));
      fireEvent.change(screen.getByRole('textbox'), {
        target: { value: 'Wrong author' }
      });
      fireEvent.click(screen.getByTestId('confirm-process-documents'));
      await waitFor(() =>
        expect(notifyError).toHaveBeenCalledExactlyOnceWith(messages[messageId])
      );
      if (status === 403) {
        await waitFor(() =>
          expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
        );
        fireEvent.click(screen.getByTestId('batch-decline'));
      }
      expect(screen.getByRole('textbox')).toHaveValue('Wrong author');
      expect(onProcessed).not.toHaveBeenCalled();
      expect(notifySuccess).not.toHaveBeenCalled();
      expect(apiPut).toHaveBeenCalledTimes(1);
    }
  );

  it.each([401, 429])(
    'leaves HTTP %i notifications to the global handler',
    async status => {
      apiPut.mockRejectedValue({ status });
      const onProcessed = vi.fn();
      renderWithProviders(
        <Actions
          selectedIds={[7]}
          onEdit={vi.fn()}
          onProcessed={onProcessed}
        />,
        { messages }
      );
      fireEvent.click(screen.getByTestId('batch-validate'));
      await act(async () =>
        fireEvent.click(screen.getByTestId('confirm-process-documents'))
      );
      await waitFor(() =>
        expect(
          screen.getByTestId('confirm-process-documents')
        ).not.toBeDisabled()
      );
      expect(onProcessed).not.toHaveBeenCalled();
      expect(notifyError).not.toHaveBeenCalled();
      expect(notifySuccess).not.toHaveBeenCalled();
      expect(apiPut).toHaveBeenCalledTimes(1);
    }
  );

  it('keeps a server failure indeterminate', async () => {
    apiPut.mockRejectedValue({ status: 500 });
    const onProcessed = vi.fn();
    renderWithProviders(
      <Actions selectedIds={[7]} onEdit={vi.fn()} onProcessed={onProcessed} />,
      { messages }
    );
    submit();
    await waitFor(() => expect(onProcessed).toHaveBeenCalledTimes(1));
    expect(onProcessed.mock.calls[0][0][0].status).toBe('indeterminate');
    expect(notifyError).toHaveBeenCalledExactlyOnceWith(
      '1 document with an indeterminate result'
    );
  });
});
