// ApplicationShell mock is async so the dynamic Outlet import always resolves
// from the same react-router-dom instance as the App module loaded after each
// vi.resetModules() call, avoiding a cross-instance router-context mismatch.
vi.mock('./pages/ApplicationShell', async () => {
  const { Outlet } = await import('react-router-dom');
  return { default: () => <Outlet /> };
});

vi.mock('./pages/homepage', () => ({ default: () => <div>Home</div> }));
vi.mock('./components/appli/PrivateRoute', () => ({
  default: () => <div>Private route</div>
}));
vi.mock('./pages/Guidelines', () => ({
  default: () => <div>Public guidelines page</div>
}));

// The router reads window.location.pathname at module load time to compute its
// basename, so each path variant needs its own module load cycle.
describe.each([
  ['production', '/ui/guidelines'],
  ['preview', '/pr/1643/ui/guidelines']
])('%s path', (_label, pathname) => {
  let App;
  let render;
  let screen;

  beforeEach(async () => {
    window.history.replaceState({}, '', pathname);
    vi.resetModules();
    [{ default: App }, { render, screen }] = await Promise.all([
      import('./App'),
      import('@testing-library/react')
    ]);
  });

  it('renders the guidelines route without an authentication guard', async () => {
    render(<App />);
    expect(await screen.findByText('Public guidelines page')).toBeVisible();
    expect(screen.queryByText('Private route')).toBeNull();
  });
});
