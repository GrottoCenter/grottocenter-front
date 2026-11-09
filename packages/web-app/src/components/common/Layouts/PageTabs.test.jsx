import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';

import grottoTheme from '@/conf/grottoTheme';
import PageTabs from './PageTabs';

const Location = () => {
  const { search } = useLocation();
  return <output data-testid="location">{search}</output>;
};

const renderTabs = ({
  lazy = true,
  path = '/?keep=value',
  searchParam,
  onChange
} = {}) =>
  render(
    <ThemeProvider theme={grottoTheme}>
      <MemoryRouter initialEntries={[path]}>
        <Location />
        <PageTabs
          searchParam={searchParam}
          onChange={onChange}
          tabs={[
            { id: 'information', label: 'Information' },
            { id: 'activity', label: 'Activity', lazy }
          ]}>
          <p>Information content</p>
          <input aria-label="Activity filter" defaultValue="" />
        </PageTabs>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

it('keeps the existing eager mounting behavior by default', () => {
  renderTabs({ lazy: false });
  expect(screen.getByLabelText('Activity filter')).toBeInTheDocument();
  expect(screen.getByLabelText('Activity filter')).not.toBeVisible();
});

it('mounts a lazy panel on first activation and keeps its state afterwards', () => {
  renderTabs();
  expect(screen.queryByLabelText('Activity filter')).toBeNull();
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
  fireEvent.change(screen.getByLabelText('Activity filter'), {
    target: { value: 'retained' }
  });
  expect(screen.getByTestId('location')).toHaveTextContent(
    '?keep=value&tab=activity'
  );
  fireEvent.click(screen.getByRole('tab', { name: 'Information' }));
  expect(screen.getByLabelText('Activity filter')).not.toBeVisible();
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
  expect(screen.getByLabelText('Activity filter')).toHaveValue('retained');
});

it('opens a lazy panel directly from its URL', () => {
  renderTabs({ path: '/?tab=activity' });
  expect(screen.getByLabelText('Activity filter')).toBeVisible();
});

it('reads and updates a custom search parameter without changing other parameters', () => {
  renderTabs({
    path: '/?type=activity&page=3',
    searchParam: 'type'
  });
  expect(screen.getByLabelText('Activity filter')).toBeVisible();
  fireEvent.click(screen.getByRole('tab', { name: 'Information' }));
  expect(screen.getByTestId('location')).toHaveTextContent(
    '?type=information&page=3'
  );
});

it('delegates tab changes when the caller owns URL updates', () => {
  const onChange = vi.fn();
  renderTabs({ searchParam: 'type', onChange });
  fireEvent.click(screen.getByRole('tab', { name: 'Activity' }));
  expect(onChange).toHaveBeenCalledExactlyOnceWith('activity');
  expect(screen.getByTestId('location')).toHaveTextContent('?keep=value');
});

it('keeps the scroll observer when only tab metadata changes', () => {
  const observer = vi.spyOn(globalThis, 'IntersectionObserver');
  // MUI also observes its scroll buttons; isolate the sticky-header observer.
  const stickyObservers = () =>
    observer.mock.calls.filter(
      ([, options]) =>
        options?.rootMargin === `-${grottoTheme.appBarHeight}px 0px 0px 0px`
    );
  const view = label => (
    <ThemeProvider theme={grottoTheme}>
      <MemoryRouter>
        <PageTabs tabs={[{ id: 'information', label }]}>
          <p>Information content</p>
        </PageTabs>
      </MemoryRouter>
    </ThemeProvider>
  );
  const { rerender } = render(view('Information'));
  expect(stickyObservers()).toHaveLength(1);
  rerender(view('Updated information'));
  expect(
    screen.getByRole('tab', { name: 'Updated information' })
  ).toBeVisible();
  expect(stickyObservers()).toHaveLength(1);
});
