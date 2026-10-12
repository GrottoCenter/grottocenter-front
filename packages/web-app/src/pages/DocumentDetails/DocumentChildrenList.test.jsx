import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { renderWithProviders } from '@/test/renderWithProviders';
import { DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';
import messages from '@/../public/lang/en.json';
import DocumentChildrenList, {
  ChildrenControls,
  DocumentChildrenTiles
} from './DocumentChildrenList';

// Load the five real file icons without opening the entire barrel on Windows.
vi.mock('@mui/icons-material', async () => ({
  PictureAsPdf: (await import('@mui/icons-material/PictureAsPdf')).default,
  Image: (await import('@mui/icons-material/Image')).default,
  Article: (await import('@mui/icons-material/Article')).default,
  TableChart: (await import('@mui/icons-material/TableChart')).default,
  InsertDriveFile: (await import('@mui/icons-material/InsertDriveFile')).default
}));

const child = { id: 42, type: 'Issue', title: 'Test issue' };
const pdf = {
  fileName: 'issue.PDF',
  completePath: 'https://example.org/issue.pdf'
};

const renderChildren = documents =>
  renderWithProviders(
    <MemoryRouter>
      <ChildrenControls documents={documents} />
      <DocumentChildrenTiles documents={documents} />
      <DocumentChildrenList documents={documents} />
    </MemoryRouter>,
    { messages }
  );

it.each([
  ['true without files', { hasFiles: true }, 'InsertDriveFileIcon'],
  [
    'true with empty files',
    { hasFiles: true, files: [] },
    'InsertDriveFileIcon'
  ],
  ['false without files', { hasFiles: false }, null],
  ['false overrides files', { hasFiles: false, files: [pdf] }, null],
  ['legacy PDF metadata', { files: [pdf] }, 'PictureAsPdfIcon'],
  [
    'legacy path without a filename',
    { files: [{ completePath: pdf.completePath }] },
    'PictureAsPdfIcon'
  ],
  [
    'true with known format',
    { hasFiles: true, files: [pdf] },
    'PictureAsPdfIcon'
  ],
  [
    'null falls back to files',
    { hasFiles: null, files: [pdf] },
    'PictureAsPdfIcon'
  ],
  [
    'legacy unknown format',
    { files: [{ fileName: 'issue.zip' }] },
    'InsertDriveFileIcon'
  ],
  ['empty files', { files: [] }, null],
  ['missing availability', {}, null]
])(
  'keeps tile, row and legend availability aligned: %s',
  (_name, fields, icon) => {
    renderChildren([{ ...child, ...fields }]);

    const items = [
      screen.getByTestId('document-child-tile'),
      screen.getByTestId('document-child-row')
    ];
    items.forEach(item => {
      const marker = within(item).queryByLabelText('File available');
      if (icon) {
        expect(marker).toBeVisible();
        expect(within(marker).getByTestId(icon)).toBeInTheDocument();
      } else {
        expect(marker).not.toBeInTheDocument();
      }
    });

    const legend = screen.queryByTestId('document-availability-legend');
    if (icon) {
      expect(legend).toBeVisible();
      expect(legend).toHaveTextContent('File available');
    } else {
      expect(legend).not.toBeInTheDocument();
    }
  }
);

it('shows the legend when only one child has a validated file', () => {
  renderChildren([
    { ...child, hasFiles: false, files: [pdf] },
    { ...child, id: 43, hasFiles: true }
  ]);

  expect(screen.getAllByLabelText('File available')).toHaveLength(2);
  expect(screen.getByTestId('document-availability-legend')).toBeVisible();
});

it.each([undefined, []])(
  'renders no children or controls for %s',
  documents => {
    const { container } = renderChildren(documents);
    expect(container).toBeEmptyDOMElement();
  }
);

it('keeps the sort control when no child has a file', () => {
  renderWithProviders(
    <ChildrenControls
      documents={[child, { ...child, id: 43 }]}
      sortOrder={DOCUMENT_SORT_ORDERS.PUBLICATION_DESC}
      onSortOrderChange={vi.fn()}
    />,
    { messages }
  );

  expect(screen.getByRole('combobox')).toBeVisible();
  expect(
    screen.queryByTestId('document-availability-legend')
  ).not.toBeInTheDocument();
});

it.each([
  ['tile', DocumentChildrenTiles],
  ['row', DocumentChildrenList]
])(
  'opens the document page from a %s with only hasFiles',
  async (_name, Component) => {
    const user = userEvent.setup();
    renderWithProviders(
      <MemoryRouter initialEntries={['/ui/documents/1']}>
        <Routes>
          <Route
            path="/ui/documents/1"
            element={<Component documents={[{ ...child, hasFiles: true }]} />}
          />
          <Route path="/ui/documents/42" element={<h1>Child document</h1>} />
        </Routes>
      </MemoryRouter>,
      { messages }
    );

    const link = screen.getByRole('link', { name: 'Test issue' });
    expect(link).toHaveAttribute('href', '/ui/documents/42');
    await user.click(link);
    expect(
      screen.getByRole('heading', { name: 'Child document' })
    ).toBeVisible();
  }
);
