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
});
