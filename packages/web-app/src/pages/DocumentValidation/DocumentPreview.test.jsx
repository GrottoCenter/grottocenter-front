import { act, screen, within, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { useDocument, useProcessDocuments } from '@/hooks';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentPreview from './DocumentPreview';

vi.mock('@/hooks', () => ({
  useDocument: vi.fn(),
  usePermissions: () => ({ isModerator: true }),
  useProcessDocuments: vi.fn(),
  useNotification: () => ({
    onSuccess: vi.fn(),
    onWarning: vi.fn(),
    onError: vi.fn()
  }),
  useOnlineStatus: () => true
}));
// Keep the moderation UI real; the public detail page has its own integration
// tests and would pull media workers and unrelated association mutations here.
vi.mock('../DocumentDetails', () => ({
  default: ({ documentData }) => (
    <div data-testid="proposed-document">{documentData.title}</div>
  )
}));

const current = {
  id: 7,
  title: 'Old title',
  dateInscription: '2026-01-01',
  isValidated: false,
  validator: { id: 9, nickname: 'Moderator' },
  files: []
};
const proposed = { id: 7, title: 'New title', files: [] };
const mutate = vi.fn();
const onEdit = vi.fn();
const renderPreview = () =>
  renderWithProviders(
    <ThemeProvider theme={createTheme()}>
      <DocumentPreview
        id={7}
        onClose={vi.fn()}
        onEdit={onEdit}
        onProcessed={vi.fn()}
      />
    </ThemeProvider>,
    { messages }
  );

beforeEach(() => {
  vi.clearAllMocks();
  useProcessDocuments.mockReturnValue({
    mutate,
    reset: vi.fn(),
    isPending: false
  });
  useDocument.mockImplementation((_id, options) => ({
    data: options?.requireUpdate ? proposed : current,
    isPending: false,
    refetch: vi.fn()
  }));
});

describe('DocumentPreview', () => {
  it('shows the proposed document and diff and validates only the displayed id', () => {
    renderPreview();
    expect(screen.getByTestId('proposed-document')).toHaveTextContent(
      'New title'
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Review a modification'
    );
    const diff = screen.getByTestId('document-diff-title');
    expect(diff.querySelector('del')).toHaveTextContent('− Old');
    expect(diff.querySelector('ins')).toHaveTextContent('+ New');
    expect(diff.querySelector('del')).not.toHaveTextContent('title');
    expect(diff.querySelector('ins')).not.toHaveTextContent('title');
    expect(screen.getByTestId('document-moderation-result')).toHaveTextContent(
      'Document after validation'
    );
    fireEvent.click(screen.getByTestId('preview-validate'));
    fireEvent.click(screen.getByTestId('confirm-process-documents'));
    expect(mutate).toHaveBeenCalledWith({
      ids: [7],
      isValidated: true,
      comment: '',
      titles: { 7: 'Old title' }
    });
  });

  it('requires a non-blank rejection reason and opens the existing edit flow', () => {
    renderPreview();
    fireEvent.click(screen.getByTestId('preview-edit'));
    expect(onEdit).toHaveBeenCalledWith(7);
    fireEvent.click(screen.getByTestId('preview-decline'));
    const confirmation = screen.getByTestId('confirm-process-documents');
    expect(confirmation).toBeDisabled();
    const dialog = confirmation.closest('[role="dialog"]');
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: '   ' }
    });
    expect(confirmation).toBeDisabled();
    fireEvent.change(within(dialog).getByRole('textbox'), {
      target: { value: 'Wrong author' }
    });
    fireEvent.click(confirmation);
    expect(mutate).toHaveBeenCalledWith({
      ids: [7],
      isValidated: false,
      comment: 'Wrong author',
      titles: { 7: 'Old title' }
    });
  });

  it('shows a creation without a diff when requireUpdate falls back to the base detail', () => {
    useDocument.mockReturnValue({
      data: { ...current, validator: null },
      isPending: false,
      refetch: vi.fn()
    });
    renderPreview();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Review a new document'
    );
    expect(screen.queryByTestId('document-diff')).not.toBeInTheDocument();
  });

  it('shows the corrected creation without comparing it to its initial submission', () => {
    useDocument.mockImplementation((_id, options) => ({
      data: options?.requireUpdate ? proposed : { ...current, validator: null },
      isPending: false,
      refetch: vi.fn()
    }));
    renderPreview();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Review a new document'
    );
    expect(screen.queryByTestId('document-diff')).not.toBeInTheDocument();
    expect(screen.getByTestId('proposed-document')).toHaveTextContent(
      'New title'
    );
  });

  it('prevents processing if the proposal fails to load', () => {
    useDocument.mockImplementation((_id, options) =>
      options?.requireUpdate
        ? { error: new Error('failed'), isPending: false, refetch: vi.fn() }
        : { data: current, isPending: false, refetch: vi.fn() }
    );
    renderPreview();
    expect(screen.getByTestId('fetch-error-state')).toBeInTheDocument();
    expect(screen.getByTestId('preview-validate')).toBeDisabled();
    expect(screen.queryByTestId('proposed-document')).not.toBeInTheDocument();
  });

  it('explains the file restriction before editing while allowing validation and refusal', () => {
    useDocument.mockImplementation((_id, options) => ({
      data: options?.requireUpdate
        ? { ...proposed, newFiles: [{ id: 9, fileName: 'Pending survey.png' }] }
        : current,
      isPending: false,
      refetch: vi.fn()
    }));
    renderPreview();
    expect(screen.getByTestId('pending-files-edit-notice')).toHaveTextContent(
      messages['documentModeration.editUnavailable']
    );
    expect(screen.getByTestId('preview-edit')).toBeDisabled();
    expect(screen.getByTestId('preview-edit')).toHaveAttribute(
      'aria-describedby',
      screen.getByTestId('pending-files-edit-notice').id
    );
    expect(screen.getByTestId('document-moderation-actions')).toContainElement(
      screen.getByTestId('pending-files-edit-notice')
    );
    expect(screen.getByTestId('preview-validate')).toBeEnabled();
    expect(screen.getByTestId('preview-decline')).toBeEnabled();
    fireEvent.click(screen.getByTestId('preview-edit'));
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('omits the edit description reference when the pending-files notice is hidden', () => {
    useDocument.mockImplementation((_id, options) => ({
      data: options?.requireUpdate
        ? { ...proposed, newFiles: [{ id: 9, fileName: 'Pending survey.png' }] }
        : current,
      isPending: !!options?.requireUpdate,
      refetch: vi.fn()
    }));
    renderPreview();
    expect(screen.getByTestId('preview-edit')).toBeDisabled();
    expect(screen.getByTestId('preview-edit')).not.toHaveAttribute(
      'aria-describedby'
    );
    expect(
      screen.queryByTestId('pending-files-edit-notice')
    ).not.toBeInTheDocument();
  });

  it('delegates an error result without closing the preview or exposing technical details', () => {
    const onProcessed = vi.fn();
    renderWithProviders(
      <ThemeProvider theme={createTheme()}>
        <DocumentPreview
          id={7}
          onClose={vi.fn()}
          onEdit={onEdit}
          onProcessed={onProcessed}
          processBatches={[
            {
              key: 0,
              results: [
                { id: 8, status: 'indeterminate', reason: null },
                {
                  id: 7,
                  status: 'error',
                  reason: 'Internal server error'
                }
              ]
            }
          ]}
        />
      </ThemeProvider>,
      { messages }
    );
    expect(
      screen.getByTestId('document-process-result-7')
    ).not.toHaveTextContent('Internal server error');
    expect(
      screen.queryByTestId('document-process-result-8')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('document-process-result-7')).toHaveTextContent(
      '1 document failed'
    );
    fireEvent.click(screen.getByTestId('preview-validate'));
    fireEvent.click(screen.getByTestId('confirm-process-documents'));
    const variables = mutate.mock.calls[0][0];
    act(() =>
      useProcessDocuments.mock.calls
        .at(-1)[0]
        .onSuccess(
          [{ id: 7, status: 'error', reason: 'Internal server error' }],
          variables
        )
    );
    expect(onProcessed).toHaveBeenCalledWith(
      [
        {
          id: 7,
          status: 'error',
          reason: 'Internal server error',
          title: 'Old title'
        }
      ],
      variables
    );
    expect(
      screen.getByTestId('document-moderation-preview')
    ).toBeInTheDocument();
  });
});
