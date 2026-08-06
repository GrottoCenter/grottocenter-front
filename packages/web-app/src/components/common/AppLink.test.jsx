import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AppLink from './AppLink';

// jsdom's user agent is a desktop one, so `isMobile` (react-device-detect) is
// false here: these run the desktop branches.
const renderLink = ui => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('AppLink', () => {
  it('keeps an internal route in the same tab', () => {
    renderLink(<AppLink to="/ui/entrances/42">Entrance</AppLink>);

    const link = screen.getByRole('link', { name: 'Entrance' });
    expect(link).toHaveAttribute('href', '/ui/entrances/42');
    expect(link).not.toHaveAttribute('target', '_blank');
  });

  it('opens an internal route in a new tab when asked to', () => {
    renderLink(
      <AppLink to="/ui/entrances/42" openInNewTabDesktop>
        Entrance
      </AppLink>
    );

    const link = screen.getByRole('link', { name: 'Entrance' });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('opens an external URL in a new tab', () => {
    renderLink(<AppLink href="https://example.org">Example</AppLink>);

    const link = screen.getByRole('link', { name: 'Example' });
    expect(link).toHaveAttribute('href', 'https://example.org');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // The destination decides, not the prop name — this is what makes AppLink
  // immune to MUI's polymorphic components deriving an `href` from a `to`
  // (ListItemButton: "href: other.href || other.to"), which is what turned the
  // whole side menu into new browser tabs.
  it('treats an app route as internal even when passed as href', () => {
    renderLink(<AppLink href="/ui/map">Map</AppLink>);

    expect(screen.getByRole('link', { name: 'Map' })).not.toHaveAttribute(
      'target',
      '_blank'
    );
  });

  it('routes in-app when both props carry the same destination', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderLink(
      <AppLink to="/ui/map" href="/ui/map">
        Map
      </AppLink>
    );

    const link = screen.getByRole('link', { name: 'Map' });
    expect(link).toHaveAttribute('href', '/ui/map');
    expect(link).not.toHaveAttribute('target', '_blank');
    // A derived duplicate is not a caller mistake: it must stay silent.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('reports two destinations that disagree', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderLink(
      <AppLink to="/ui/map" href="https://example.org">
        Map
      </AppLink>
    );

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('disagree')
    );
    consoleError.mockRestore();
  });

  it('renders inert children when there is no destination', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderLink(<AppLink>Nowhere</AppLink>);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('Nowhere')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
