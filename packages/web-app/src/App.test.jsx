import { render, screen } from '@testing-library/react';
import { Outlet } from 'react-router-dom';

import App from './App';

vi.hoisted(() => {
  window.history.replaceState({}, '', '/ui/guidelines');
});

vi.mock('./pages/ApplicationShell', () => ({
  default: () => <Outlet />
}));

vi.mock('./pages/homepage', () => ({ default: () => <div>Home</div> }));
vi.mock('./components/appli/PrivateRoute', () => ({
  default: () => <div>Private route</div>
}));
vi.mock('./pages/Guidelines', () => ({
  default: () => <div>Public guidelines page</div>
}));

it('renders the guidelines route without an authentication guard', async () => {
  render(<App />);

  expect(await screen.findByText('Public guidelines page')).toBeVisible();
  expect(screen.queryByText('Private route')).toBeNull();
});
