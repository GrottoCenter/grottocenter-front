import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import grottoTheme from '@/conf/grottoTheme';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '../../../../public/lang/en.json';
import EntityPageTabs from './EntityPageTabs';

const tabs = [
  { id: 'information' },
  { id: 'documents', count: 4 },
  { id: 'science' },
  { id: 'comments', count: 2 }
];
const panels = {
  information: <p>Entity properties</p>,
  documents: <p>Linked documents</p>,
  // An entrance without a cave has no Science content, even for an admin.
  science: null,
  comments: <p>Entity comments</p>
};

const renderTabs = (props = {}, path = '/?tab=information') => {
  const renderPage = overrides => (
    <ThemeProvider theme={grottoTheme}>
      <MemoryRouter initialEntries={[path]}>
        <EntityPageTabs
          tabs={overrides.tabs ?? tabs}
          panels={overrides.panels ?? panels}
          error={overrides.error}
          isLoading={overrides.isLoading}
          isPaused={overrides.isPaused}
          onRetry={overrides.onRetry}
          errorMessageId="Error, the data you are looking for is not available."
        />
      </MemoryRouter>
    </ThemeProvider>
  );
  const result = renderWithProviders(renderPage(props), { messages });
  return {
    ...result,
    rerenderTabs: overrides => result.rerender(renderPage(overrides))
  };
};

beforeEach(() => {
  Object.defineProperty(navigator, 'onLine', {
    value: true,
    configurable: true
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

it('uses the entrance icons and labels with the entity counts and permissions', () => {
  renderTabs({
    tabs: [{ id: 'information' }, { id: 'documents', count: 4, disabled: true }]
  });
  expect(
    within(screen.getByRole('tab', { name: 'Information' })).getByTestId(
      'ExploreOutlinedIcon'
    )
  ).toBeInTheDocument();
  const documentsTab = screen.getByRole('tab', { name: 'Documents' });
  expect(
    within(documentsTab).getByTestId('PermMediaOutlinedIcon')
  ).toBeInTheDocument();
  expect(within(documentsTab).getByText('4')).toBeInTheDocument();
  expect(documentsTab).toBeDisabled();
});

it('keeps Comments in its own panel when Science content is absent', async () => {
  const user = userEvent.setup();
  renderTabs({}, '/?tab=comments');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Entity comments');
  await user.click(screen.getByRole('tab', { name: 'Science' }));
  expect(screen.getByRole('tabpanel').textContent).toBe('');
  expect(screen.getByText('Entity comments')).not.toBeVisible();
});

it('preserves the selected tab by id when the available tabs change', () => {
  const { rerenderTabs } = renderTabs({}, '/?tab=comments');
  rerenderTabs({ tabs: tabs.filter(tab => tab.id !== 'science') });
  expect(screen.getByRole('tab', { name: 'Comments' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Entity comments');
});

it('shows the same error card and retries from any active tab', async () => {
  const user = userEvent.setup();
  const onRetry = vi.fn();
  renderTabs(
    { error: { status: 404 }, onRetry, panels: {} },
    '/?tab=documents'
  );
  const panel = screen.getByRole('tabpanel');
  expect(within(panel).getByTestId('entity-page-state')).toBeInTheDocument();
  expect(within(panel).getByRole('alert')).toHaveTextContent(
    'Error, the data you are looking for is not available.'
  );
  expect(screen.queryByText('Linked documents')).not.toBeInTheDocument();
  await user.click(within(panel).getByRole('button', { name: 'Retry' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

it('shows the offline state instead of loading indefinitely when a retry is paused', () => {
  Object.defineProperty(navigator, 'onLine', {
    value: false,
    configurable: true
  });
  renderTabs({ isLoading: true, isPaused: true, onRetry: vi.fn() });
  expect(screen.getByRole('alert')).toHaveTextContent(
    messages.offlineActionUnavailable
  );
  expect(
    screen.queryByRole('button', { name: 'Retry' })
  ).not.toBeInTheDocument();
});

it('restores the selected panel after loading without losing tab navigation', () => {
  const { rerenderTabs } = renderTabs(
    { isLoading: true, panels: {} },
    '/?tab=documents'
  );
  expect(
    within(screen.getByRole('tabpanel')).getByTestId('entity-page-state')
  ).toBeInTheDocument();
  rerenderTabs({ isLoading: false });
  expect(screen.getByRole('tab', { name: 'Documents' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Linked documents');
});

it('keeps already loaded content mounted when a background refresh fails', () => {
  const { rerenderTabs } = renderTabs({}, '/?tab=documents');
  const content = screen.getByText('Linked documents');
  rerenderTabs({ error: { status: 500 } });
  expect(screen.getByText('Linked documents')).toBe(content);
  expect(content).toBeVisible();
  expect(screen.getByRole('alert')).toBeVisible();
});
