import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/renderWithProviders';
import { apiGet } from '@/api/client';
import { usePdfExportDocuments } from './usePdfExportDocuments';

vi.mock('@/api/client', () => ({ apiGet: vi.fn() }));
const listedDocuments = [
  { id: 1, title: 'First survey' },
  { id: 2, title: 'Second survey' }
];
const initial = {
  listedDocuments,
  includeDocuments: false,
  selected: {},
  excluded: {},
  open: true
};
const Probe = ({ options }) => {
  const { groups, files, isBlocked } = usePdfExportDocuments(options);
  return (
    <output data-document-ids={groups.map(row => row.document.id).join(',')}>
      {isBlocked ? 'pending' : files.map(file => file.fileName).join(',')}
    </output>
  );
};
beforeEach(() => vi.clearAllMocks());

it('loads only a selected document when the document section is disabled', async () => {
  apiGet.mockResolvedValue({
    id: 1,
    title: 'First survey',
    files: [
      {
        id: 10,
        fileName: 'plan.pdf',
        completePath: 'https://example.org/plan.pdf'
      }
    ]
  });
  const { rerender } = renderWithProviders(<Probe options={initial} />);
  expect(apiGet).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  rerender(<Probe options={{ ...initial, selected: { 1: true } }} />);
  await waitFor(() =>
    expect(screen.getByRole('status')).toHaveTextContent('plan.pdf')
  );
  expect(apiGet).toHaveBeenCalledOnce();
  expect(apiGet.mock.calls[0][0]).toMatch(/\/documents\/1$/);
  rerender(
    <Probe options={{ ...initial, selected: { 1: true }, open: false }} />
  );
  expect(apiGet).toHaveBeenCalledOnce();
});

it('does not query an excluded document even when all references are requested', async () => {
  apiGet.mockResolvedValue({ id: 1, title: 'First survey', files: [] });
  renderWithProviders(
    <Probe
      options={{ ...initial, includeDocuments: true, excluded: { 2: true } }}
    />
  );
  await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
  expect(apiGet).toHaveBeenCalledOnce();
  expect(apiGet.mock.calls[0][0]).toMatch(/\/documents\/1$/);
});

it('keeps shared-file documents selectable and deduplicates only selected appendices', async () => {
  const sharedDocuments = listedDocuments.map(document => ({
    ...document,
    files: [
      {
        fileName: 'plan.pdf',
        completePath: 'https://example.org/plan.pdf'
      }
    ]
  }));
  apiGet.mockImplementation(url =>
    Promise.resolve(
      sharedDocuments.find(document => url.endsWith(`/${document.id}`))
    )
  );
  const { rerender } = renderWithProviders(
    <Probe options={{ ...initial, includeDocuments: true }} />
  );
  await waitFor(() => expect(screen.getByRole('status')).toBeEmptyDOMElement());
  expect(screen.getByRole('status')).toHaveAttribute(
    'data-document-ids',
    '1,2'
  );

  rerender(<Probe options={{ ...initial, selected: { 2: true } }} />);
  expect(screen.getByRole('status')).toHaveTextContent('plan.pdf');
  expect(screen.getByRole('status')).toHaveAttribute(
    'data-document-ids',
    '1,2'
  );

  rerender(<Probe options={{ ...initial, selected: { 1: true, 2: true } }} />);
  expect(screen.getByRole('status').textContent).toBe('plan.pdf');
  expect(apiGet).toHaveBeenCalledTimes(2);
});
