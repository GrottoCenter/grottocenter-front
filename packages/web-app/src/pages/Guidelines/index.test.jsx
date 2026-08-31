import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import { useGuidelines, useNotification } from '@/hooks';
import GuidelinesPage from './index';

vi.mock('@/hooks', () => ({
  useGuidelines: vi.fn(),
  useNotification: vi.fn()
}));

vi.mock('@/components/common/CustomIcon', () => ({
  default: () => <span data-testid="guidelines-icon" />
}));

vi.mock('@/components/common/Layouts/Fixed/FixedContent', () => ({
  default: ({ title, subheader, content }) => (
    <main>
      <h1>{title}</h1>
      {subheader}
      {content}
    </main>
  )
}));

vi.mock('@/components/common/EntityTable', () => ({
  default: props => (
    <div>
      <span data-testid="total-count">{props.nbTotalRows}</span>
      <span data-testid="loading">{String(props.isLoading)}</span>
      <button type="button" onClick={() => props.onPageChange(2, 50)}>
        Change page
      </button>
    </div>
  )
}));

const messages = {
  Guidelines: 'Guidelines',
  'guidelines.public.empty': 'No guideline is currently available.',
  'guidelines.public.fetch_error': 'Unable to load guidelines.',
  'guidelines.public.introduction': 'Browse public guidelines.'
};

const renderPage = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <GuidelinesPage />
    </IntlProvider>
  );

beforeEach(() => {
  useNotification.mockReturnValue({ onError: vi.fn() });
});

it('renders the total and requests the selected server page', () => {
  useGuidelines.mockReturnValue({
    data: { guidelines: [{ id: 1 }], totalCount: 126 },
    error: null,
    isFetching: false
  });

  renderPage();
  expect(screen.getByTestId('total-count')).toHaveTextContent('126');

  fireEvent.click(screen.getByRole('button', { name: 'Change page' }));
  expect(useGuidelines).toHaveBeenLastCalledWith({ limit: 50, skip: 100 });
});

it('shows the translated informational empty state', () => {
  useGuidelines.mockReturnValue({
    data: { guidelines: [], totalCount: 0 },
    error: null,
    isFetching: false
  });

  renderPage();

  expect(screen.getByRole('alert')).toHaveTextContent(
    'No guideline is currently available.'
  );
});

it('reports API errors through notifications', async () => {
  const onError = vi.fn();
  useNotification.mockReturnValue({ onError });
  useGuidelines.mockReturnValue({
    data: undefined,
    error: { status: 500, message: 'internal details' },
    isFetching: false
  });

  renderPage();

  await waitFor(() =>
    expect(onError).toHaveBeenCalledWith('Unable to load guidelines.')
  );
});
