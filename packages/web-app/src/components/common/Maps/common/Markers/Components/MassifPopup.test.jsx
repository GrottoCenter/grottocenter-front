import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
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
