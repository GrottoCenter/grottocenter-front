import { fireEvent, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import copyToClipboard from '@/utils/clipboard';
import renderWithProviders from '../../test/renderWithProviders';
import PageErrorBoundary, { PageError } from './PageErrorBoundary';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async importOriginal => {
  const original = await importOriginal();
  return {
    ...original,
    useNavigate: () => mockNavigate
  };
});

vi.mock('@/utils/clipboard', () => ({ default: vi.fn() }));

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/ui/test-page']}>
      <PageError error={new TypeError('Sensitive error message')} />
    </MemoryRouter>
  );

const BrokenPage = () => {
  throw new Error('Render failure');
};

describe('PageError', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    copyToClipboard.mockReset();
  });

  it('shows generic recovery actions and focuses the error title', () => {
    renderPage();

    const title = screen.getByRole('heading', {
      name: 'An unexpected error occurred'
    });
    expect(title).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Return to home' })
    ).toHaveAttribute('href', '/');
  });

  it('reloads the current page when retrying', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(mockNavigate).toHaveBeenCalledWith(0);
  });

  it('provides safe technical details without the raw error message', () => {
    renderPage();

    fireEvent.click(screen.getByText('Technical details'));

    expect(screen.getByText(/Error type: TypeError/)).toBeVisible();
    expect(screen.getByText(/Page address: \/ui\/test-page/)).toBeVisible();
    expect(
      screen.queryByText(/Sensitive error message/)
    ).not.toBeInTheDocument();
  });

  it('copies the technical report and confirms it accessibly', async () => {
    copyToClipboard.mockResolvedValue();
    renderPage();

    fireEvent.click(screen.getByText('Technical details'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy details' }));

    await waitFor(() => expect(copyToClipboard).toHaveBeenCalledOnce());
    expect(copyToClipboard.mock.calls[0][0]).toContain(
      'Page address: /ui/test-page'
    );
    expect(screen.getByText('Technical details copied')).toBeVisible();
  });

  it('clears the error boundary after returning home', async () => {
    renderWithProviders(
      <MemoryRouter initialEntries={['/broken']}>
        <PageErrorBoundary>
          <Routes>
            <Route path="/" element={<p>Home page</p>} />
            <Route path="/broken" element={<BrokenPage />} />
          </Routes>
        </PageErrorBoundary>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('link', { name: 'Return to home' }));

    expect(await screen.findByText('Home page')).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'An unexpected error occurred' })
    ).not.toBeInTheDocument();
  });
});
