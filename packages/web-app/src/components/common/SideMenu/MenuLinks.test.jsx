import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import MenuLinks from './MenuLinks';

const renderMenu = () =>
  render(
    <IntlProvider locale="en">
      <MemoryRouter>
        <MenuLinks />
      </MemoryRouter>
    </IntlProvider>
  );

describe('MenuLinks', () => {
  // Regression guard. ListItemButton derives an `href` from `to` before handing
  // the props to its `component`; back when AppLink read any `href` as an
  // external URL, that silently turned every entry of the side menu into a new
  // browser tab. AppLink now decides from the value, but nothing about the
  // rendering looks wrong when this breaks, so only an assertion catches it.
  it('navigates in-app: no menu entry opens a new tab', () => {
    renderMenu();

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    links.forEach(link => {
      expect(link).not.toHaveAttribute('target', '_blank');
      // A router link keeps the app-relative path; the external branch would
      // have rendered a bare anchor instead.
      expect(link.getAttribute('href')).toMatch(/^\/ui\//);
    });
  });

  it('points each entry at its section', () => {
    renderMenu();

    expect(screen.getByRole('link', { name: 'Map' })).toHaveAttribute(
      'href',
      '/ui/map'
    );
    expect(screen.getByRole('link', { name: 'Entrances' })).toHaveAttribute(
      'href',
      '/ui/entrances'
    );
  });
});
