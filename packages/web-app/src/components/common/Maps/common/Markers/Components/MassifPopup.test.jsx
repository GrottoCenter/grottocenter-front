import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import frenchMessages from '@/../public/lang/fr.json';
import arabicMessages from '@/../public/lang/ar.json';
import romanianMessages from '@/../public/lang/ro.json';
import MassifPopup from './MassifPopup';

it.each([
  [3, 1, '3 Entrances', '1 Network'],
  [0, 0, '0 Entrances', '0 Networks']
])(
  'displays %s entrances and %s networks independently',
  (entranceCount, networkCount, entranceLabel, networkLabel) => {
    renderWithProviders(
      <MemoryRouter>
        <MassifPopup
          massif={{ id: 7, name: 'Test massif', entranceCount, networkCount }}
        />
      </MemoryRouter>,
      { messages }
    );
    expect(screen.getByText(entranceLabel)).toBeVisible();
    expect(screen.getByText(networkLabel)).toBeVisible();
  }
);

it.each([
  [0, '0 Entrée', '0 Réseau'],
  [1, '1 Entrée', '1 Réseau'],
  [2, '2 Entrées', '2 Réseaux']
])(
  'uses French plural rules for %s entrances and networks',
  (count, entranceLabel, networkLabel) => {
    renderWithProviders(
      <MemoryRouter>
        <MassifPopup
          massif={{
            id: 7,
            name: 'Test massif',
            entranceCount: count,
            networkCount: count
          }}
        />
      </MemoryRouter>,
      { messages: frenchMessages, locale: 'fr' }
    );
    expect(screen.getByText(entranceLabel)).toBeVisible();
    expect(screen.getByText(networkLabel)).toBeVisible();
  }
);

it('uses the Arabic dual form for two networks', () => {
  renderWithProviders(
    <MemoryRouter>
      <MassifPopup massif={{ id: 7, name: 'Test massif', networkCount: 2 }} />
    </MemoryRouter>,
    { messages: arabicMessages, locale: 'ar' }
  );
  expect(screen.getByText('2 شبكتان')).toBeVisible();
});

describe.each(['ro', 'ro-RO'])('Romanian count labels (%s)', locale => {
  it.each([
    [0, 'intrări', 'rețele'],
    [1, 'intrare', 'rețea'],
    [2, 'intrări', 'rețele'],
    [19, 'intrări', 'rețele'],
    [20, 'de intrări', 'de rețele'],
    [21, 'de intrări', 'de rețele'],
    [25, 'de intrări', 'de rețele'],
    [100, 'de intrări', 'de rețele'],
    [101, 'intrări', 'rețele'],
    [119, 'intrări', 'rețele'],
    [120, 'de intrări', 'de rețele']
  ])('formats %s entrances and networks', (count, entrances, networks) => {
    renderWithProviders(
      <MemoryRouter>
        <MassifPopup
          massif={{
            id: 7,
            name: 'Test massif',
            entranceCount: count,
            networkCount: count
          }}
        />
      </MemoryRouter>,
      { messages: romanianMessages, locale }
    );
    expect(screen.getByText(`${count} ${entrances}`)).toBeVisible();
    expect(screen.getByText(`${count} ${networks}`)).toBeVisible();
  });
});

it.each([undefined, null])('omits unavailable counts (%s)', count => {
  const { container } = renderWithProviders(
    <MemoryRouter>
      <MassifPopup
        massif={{
          id: 7,
          name: 'Test massif',
          entranceCount: count,
          networkCount: count
        }}
      />
    </MemoryRouter>,
    { messages }
  );
  expect(screen.getByRole('link', { name: 'Test massif' })).toBeVisible();
  expect(container.textContent).toBe('Test massif');
});
