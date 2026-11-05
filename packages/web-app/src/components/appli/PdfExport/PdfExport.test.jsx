import { fireEvent, screen, within } from '@testing-library/react';
import { useQueries } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { renderWithProviders } from '@/test/renderWithProviders';
import { downloadBlob } from '@/components/common/DocumentsList/utils/imageUtils';
import { usePdfExport } from '@/hooks/usePdfExport';
import messages from '../../../../public/lang/en.json';
import PdfExport from './index';

vi.mock('@/hooks/usePdfExport', () => ({ usePdfExport: vi.fn() }));
vi.mock('@tanstack/react-query', async importOriginal => ({
  ...(await importOriginal()),
  useQueries: vi.fn()
}));
vi.mock('notistack', async importOriginal => ({
  ...(await importOriginal()),
  useSnackbar: vi.fn()
}));
vi.mock(
  '@/components/common/DocumentsList/utils/imageUtils',
  async importOriginal => ({
    ...(await importOriginal()),
    downloadBlob: vi.fn()
  })
);

const cancel = vi.fn();
const onClose = vi.fn();
const enqueueSnackbar = vi.fn();
const brokenDocument = {
  id: 3,
  title: 'Broken survey',
  type: 'Topographic Drawing',
  files: [
    {
      id: 4,
      fileName: 'survey.pdf',
      completePath: 'https://example.org/survey.pdf'
    }
  ]
};
const renderDialog = (isGenerating = false, options = {}) => {
  usePdfExport.mockReturnValue({
    generate: options.generate ?? vi.fn(),
    cancel,
    isGenerating,
    error: null,
    progress: ''
  });
  return renderWithProviders(
    <PdfExport
      entity={options.entity ?? { id: 1, name: 'Test cave' }}
      entityType="entrance"
      isAdmin={false}
      open
      onClose={onClose}
    />,
    {
      messages: {
        ...messages,
        'pdf.download': 'Download PDF',
        'pdf.help': 'Choose the content.',
        'pdf.attachments': 'Full-page documents',
        'pdf.attachmentsHelp': 'Choose documents.'
      }
    }
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  useQueries.mockReturnValue([]);
  useSnackbar.mockReturnValue({ enqueueSnackbar });
});

it.each([false, true])(
  'provides one outlined cancel action and stable download action while generating: %s',
  isGenerating => {
    renderDialog(isGenerating);
    cancel.mockClear();
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toHaveClass('MuiButton-outlined');
    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument();
    const downloadButton = screen.getByRole('button', { name: 'Download PDF' });
    expect(downloadButton.disabled).toBe(isGenerating);
    expect(downloadButton.closest('.MuiDialogActions-root')).not.toHaveClass(
      'MuiDialogActions-spacing'
    );
    expect(
      screen.getByRole('checkbox', { name: 'General Information' }).disabled
    ).toBe(isGenerating);
    fireEvent.click(cancelButton);
    expect(cancel).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  }
);

it('uses the same cancellation path for Escape', () => {
  renderDialog(true);
  cancel.mockClear();
  fireEvent.keyDown(screen.getByRole('dialog'), {
    key: 'Escape',
    code: 'Escape'
  });
  expect(cancel).toHaveBeenCalledOnce();
  expect(onClose).toHaveBeenCalledOnce();
});

it('separates main content including documents from full-page appendices', () => {
  useQueries.mockReturnValue([
    {
      data: brokenDocument,
      dataUpdatedAt: 1,
      isPending: false,
      isError: false
    }
  ]);
  renderDialog(false, {
    entity: {
      id: 1,
      name: 'Test cave',
      latitude: 45,
      longitude: 5,
      precision: 10,
      cave: { id: 2 },
      documents: [brokenDocument]
    }
  });
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAccessibleName('Download PDF · Test cave');
  const mainContent = screen.getByRole('group', {
    name: messages['pdf.mainContent']
  });
  const appendices = screen.getByRole('group', {
    name: messages['pdf.appendices']
  });
  expect(
    within(mainContent).getByRole('checkbox', { name: 'Map' })
  ).toBeChecked();
  fireEvent.click(within(mainContent).getByRole('checkbox', { name: 'Map' }));
  expect(
    within(mainContent).getByRole('checkbox', { name: 'Map' })
  ).not.toBeChecked();
  expect(
    within(mainContent).getByRole('checkbox', { name: 'General Information' })
  ).toBeChecked();
  expect(
    within(mainContent).getByRole('checkbox', { name: 'Documents' })
  ).toBeChecked();
  expect(
    within(appendices).queryByRole('checkbox', { name: 'Documents' })
  ).not.toBeInTheDocument();
  expect(appendices).toHaveAccessibleDescription(
    messages['pdf.appendicesHelp']
  );
  expect(
    within(mainContent).queryByRole('checkbox', { name: /Broken survey/ })
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(appendices).getByRole('checkbox', { name: /Broken survey/ })
  );
  expect(dialog.querySelectorAll('fieldset')).toHaveLength(2);
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
  expect(
    screen.queryByText(messages['pdf.mapOptions'])
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('checkbox', {
      name: messages['pdf.networkDescriptions']
    })
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Choose the content.')).not.toBeInTheDocument();
  expect(screen.queryByText('Choose documents.')).not.toBeInTheDocument();
  expect(
    screen.queryByText(messages['pdf.sheetDocumentsHelp'])
  ).not.toBeInTheDocument();
});

it('keeps exactly one compact page format selected and exports that choice', async () => {
  useQueries.mockReturnValue([
    {
      data: brokenDocument,
      dataUpdatedAt: 1,
      isPending: false,
      isError: false
    }
  ]);
  const generate = vi.fn().mockResolvedValue(null);
  renderDialog(false, {
    entity: { id: 1, name: 'Test cave', documents: [brokenDocument] },
    generate
  });
  expect(
    screen.queryByRole('group', { name: messages['pdf.pageFormat'] })
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: /Broken survey/ }));
  const formats = screen.getByRole('group', {
    name: messages['pdf.pageFormat']
  });
  const a4 = within(formats).getByRole('button', { name: 'A4' });
  const original = within(formats).getByRole('button', {
    name: messages['pdf.originalSizeShort']
  });
  expect(a4).toHaveAttribute('aria-pressed', 'true');
  expect(original).toHaveAttribute('aria-pressed', 'false');
  fireEvent.click(a4);
  expect(a4).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(original);
  expect(a4).toHaveAttribute('aria-pressed', 'false');
  expect(original).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(original);
  expect(original).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByTestId('entrance-pdf-download'));
  await vi.waitFor(() =>
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'original' })
    )
  );
});

it('closes and announces the download only after a PDF is available', async () => {
  const blob = new Blob(['%PDF'], { type: 'application/pdf' });
  const generate = vi.fn().mockResolvedValue(blob);
  renderDialog(false, { generate });
  fireEvent.click(screen.getByTestId('entrance-pdf-download'));
  await vi.waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(downloadBlob).toHaveBeenCalledWith(blob, 'Test cave.pdf');
  expect(enqueueSnackbar).toHaveBeenCalledWith(
    messages['pdf.downloadStarted'],
    { variant: 'success' }
  );
});

it('keeps the dialog and choices when generation fails', async () => {
  const generate = vi.fn().mockResolvedValue(null);
  renderDialog(false, { generate });
  fireEvent.click(screen.getByTestId('entrance-pdf-download'));
  await vi.waitFor(() => expect(generate).toHaveResolved());
  expect(onClose).not.toHaveBeenCalled();
  expect(downloadBlob).not.toHaveBeenCalled();
  expect(enqueueSnackbar).not.toHaveBeenCalled();
  expect(
    screen.getByRole('checkbox', { name: 'General Information' })
  ).toBeChecked();
});

it('allows explicit exclusion of a failed document without a late response cancelling the export', () => {
  const entity = { id: 1, name: 'Test cave', documents: [brokenDocument] };
  const query = {
    isPending: false,
    isError: true,
    dataUpdatedAt: 0,
    refetch: vi.fn()
  };
  useQueries.mockReturnValue([query]);
  const { rerender } = renderDialog(false, { entity });
  expect(screen.getByTestId('entrance-pdf-download')).toBeDisabled();
  expect(
    screen.getByRole('checkbox', { name: /Broken survey/ })
  ).toBeDisabled();
  fireEvent.click(
    screen.getByRole('button', { name: messages['pdf.excludeDocument'] })
  );
  expect(screen.getByTestId('entrance-pdf-download')).toBeEnabled();
  expect(
    screen.queryByRole('checkbox', { name: /Broken survey/ })
  ).not.toBeInTheDocument();
  cancel.mockClear();
  useQueries.mockReturnValue([
    { ...query, isError: false, data: brokenDocument, dataUpdatedAt: 1 }
  ]);
  rerender(
    <PdfExport
      entity={entity}
      entityType="entrance"
      isAdmin={false}
      open
      onClose={onClose}
    />
  );
  expect(cancel).not.toHaveBeenCalled();
});
