import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import RecentChangesList from './RecentChangesList';

const messages = {
  deleted: 'deleted',
  Retry: 'Retry',
  'No recent activity': 'No recent activity',
  'the cave': 'the cave',
  'the guideline': 'the guideline',
  'Unable to load activities': 'Unable to load activities',
  offlineActionUnavailable: 'You are offline',
  offlineContentUnavailable: 'Reconnect to load this content',
  unknown: 'unknown',
  updated: 'updated'
};

const renderList = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <MemoryRouter>
        <RecentChangesList {...props} />
      </MemoryRouter>
    </IntlProvider>
  );

const baseChange = {
  date: '2026-08-16T12:00:00.000Z',
  authorId: 1,
  author: 'Paul',
  mainEntityType: 'guideline',
  mainEntityId: 7,
  mainAction: 'update',
  subEntityTypes: [],
  subAction: null,
  name: 'Safety rule'
};

describe('RecentChangesList', () => {
  it('renders a dedicated empty state', () => {
    renderList({ changes: [] });

    expect(screen.getByText('No recent activity')).toBeInTheDocument();
  });

  it('renders a guideline without linking it to the home page', () => {
    renderList({ changes: [baseChange] });

    const entityName = screen.getByText('Safety rule');
    expect(entityName.parentElement).toHaveTextContent(
      'updated the guideline Safety rule'
    );
    expect(entityName.closest('a')).toBeNull();
  });

  it('does not link to a deleted entity', () => {
    renderList({
      changes: [
        {
          ...baseChange,
          mainEntityType: 'cave',
          mainAction: 'delete',
          name: 'Deleted cave'
        }
      ]
    });

    expect(screen.getByText('Deleted cave').closest('a')).toBeNull();
  });

  it('shows an actionable error state', () => {
    const onRetry = vi.fn();
    renderList({
      changes: [],
      error: { message: 'Feed unavailable' },
      onRetry
    });

    expect(screen.getByText('Unable to load activities')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('shows paused initial loading as offline instead of a perpetual skeleton', () => {
    renderList({ isLoading: true, isPaused: true });
    expect(screen.getByText('You are offline')).toBeVisible();
    expect(screen.queryByText('No recent activity')).toBeNull();
  });
});
