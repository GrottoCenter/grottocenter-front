import { act, fireEvent, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useDocuments } from '@/hooks';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import DocumentValidationPage from './index';
import ProcessResults from './ProcessResults';

vi.mock('@/hooks', () => ({
  useDocuments: vi.fn(),
  usePermissions: () => ({ isModerator: true })
}));
vi.mock('../../components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ action, content }) => (
    <div>
      {action}
      {content}
    </div>
  )
}));
vi.mock('../../components/appli/AuthChecker', () => ({
  default: ({ componentToDisplay }) => componentToDisplay
}));
vi.mock('../../components/common/EntityTable', () => ({
  default: ({ onSelected, onRowClick, selectedIds, nbTotalRows }) => (
    <div>
      <div data-testid="selection">{selectedIds.join(',')}</div>
      <div data-testid="count">{nbTotalRows}</div>
      <button type="button" onClick={() => onSelected([7, 8])}>
        Select batch
      </button>
      <button type="button" onClick={() => onSelected([7, 8, 99])}>
        New selection
      </button>
      <button type="button" onClick={() => onRowClick({ id: 8 })}>
        Preview failed
      </button>
      <button type="button" onClick={() => onRowClick({ id: 7 })}>
        Preview finished
      </button>
      <button type="button" onClick={() => onRowClick({ id: 99 })}>
        Preview new
      </button>
    </div>
  )
}));
vi.mock('./Actions', () => ({
  default: ({ onProcessed, draft }) => (
    <>
      <div data-testid="draft">{draft.comment}</div>
      <button
        type="button"
        onClick={() =>
          onProcessed(
            [
              { id: 7, status: 'validated' },
              {
                id: 8,
                status: 'error',
                title: 'Failed document',
                reason: 'Internal error'
              }
            ],
            { ids: [7, 8], isValidated: false, comment: 'Wrong author' }
          )
        }>
        Process batch
      </button>
    </>
  )
}));
vi.mock('./DocumentPreview', () => ({
  default: ({ id, onProcessed }) => (
    <div data-testid="preview">
      {id}
      <button
        type="button"
        onClick={() => onProcessed([{ id, status: 'not_found' }])}>
        Finish preview
      </button>
    </div>
  )
}));
vi.mock('../DocumentEdit', () => ({ default: () => null }));

const renderPage = () =>
  renderWithProviders(
    <ThemeProvider theme={createTheme()}>
      <DocumentValidationPage />
    </ThemeProvider>,
    { messages }
  );

beforeEach(() => {
  useDocuments.mockReturnValue({
    data: { documents: [], totalCount: 2 },
    isFetching: false
  });
});

describe('document moderation page', () => {
  it('keeps failed and new selections and leaves a failed preview open', () => {
    const { rerender } = renderPage();
    fireEvent.click(screen.getByText('Select batch'));
    fireEvent.click(screen.getByText('Preview failed'));
    fireEvent.click(screen.getByText('New selection'));
    fireEvent.click(screen.getByText('Process batch'));
    expect(screen.getByTestId('selection')).toHaveTextContent('8,99');
    expect(screen.getByTestId('preview')).toHaveTextContent('8');
    expect(screen.getByTestId('document-process-result-8')).toHaveTextContent(
      'Failed document'
    );
    expect(
      screen.getByTestId('document-process-result-8')
    ).not.toHaveTextContent('Internal error');
    useDocuments.mockReturnValue({
      data: { documents: [], totalCount: 1 },
      isFetching: false
    });
    act(() =>
      rerender(
        <ThemeProvider theme={createTheme()}>
          <DocumentValidationPage />
        </ThemeProvider>
      )
    );
    expect(screen.getByTestId('count')).toHaveTextContent('1');
    expect(screen.getByTestId('selection')).toHaveTextContent('8,99');
  });

  it('closes only the preview whose result is finished', () => {
    renderPage();
    fireEvent.click(screen.getByText('Preview new'));
    fireEvent.click(screen.getByText('Process batch'));
    expect(screen.getByTestId('preview')).toHaveTextContent('99');
    fireEvent.click(screen.getByText('Preview finished'));
    fireEvent.click(screen.getByText('Process batch'));
    expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Preview failed'));
    fireEvent.click(screen.getByText('Finish preview'));
    expect(screen.queryByTestId('preview')).not.toBeInTheDocument();
  });

  it('preserves unresolved submission context after an unrelated document finishes', () => {
    renderPage();
    fireEvent.click(screen.getByText('Process batch'));
    expect(screen.getByTestId('draft')).toHaveTextContent('Wrong author');
    fireEvent.click(screen.getByText('Preview new'));
    fireEvent.click(screen.getByText('Finish preview'));
    expect(screen.getByTestId('draft')).toHaveTextContent('Wrong author');
  });

  it('renders auto rejection reasons as plain text', () => {
    // The results component is shared by the page and the preview.
    renderWithProviders(
      <ProcessResults
        batches={[
          {
            key: 0,
            results: [
              {
                id: 7,
                status: 'auto_rejected',
                reason: '<b>Invalid attachment</b>'
              }
            ]
          }
        ]}
      />,
      { messages }
    );
    const detail = screen.getByTestId('document-process-result-7');
    expect(detail).toHaveTextContent('<b>Invalid attachment</b>');
    expect(detail.querySelector('b')).toBeNull();
  });
});
