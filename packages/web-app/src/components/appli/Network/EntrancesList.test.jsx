import { fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/en.json';
import EntrancesList from './EntrancesList';

it('retains sorting, map selection and in-app navigation in the inline panel', () => {
  const onToggleSelection = vi.fn();
  renderWithProviders(
    <MemoryRouter initialEntries={['/network']}>
      <Routes>
        <Route
          path="/network"
          element={
            <EntrancesList
              inline
              isLoading={false}
              entrances={[
                { id: 2, name: 'Zeta' },
                { id: 1, name: 'Alpha' }
              ]}
              selectedEntrancesId={[1, 2]}
              onToggleSelection={onToggleSelection}
            />
          }
        />
        <Route path="/ui/entrances/1" element={<p>Entrance route</p>} />
      </Routes>
    </MemoryRouter>,
    { messages }
  );
  expect(
    screen.getByRole('heading', { level: 2, name: 'Entrances' })
  ).toBeVisible();
  const links = screen.getAllByRole('link');
  expect(links.map(link => link.textContent)).toEqual(['Alpha', 'Zeta']);
  expect(links[0]).toHaveAttribute('href', '/ui/entrances/1');
  expect(links[0]).not.toHaveAttribute('target');
  fireEvent.click(screen.getAllByRole('button', { name: 'Hide from map' })[0]);
  expect(onToggleSelection).toHaveBeenCalledWith(1);
  expect(screen.getByRole('link', { name: /Alpha$/ })).toBeVisible();
  fireEvent.click(links[0]);
  expect(screen.getByText('Entrance route')).toBeVisible();
});

it('retains the empty state inside the inline panel', () => {
  renderWithProviders(
    <MemoryRouter>
      <EntrancesList inline isLoading={false} entrances={[]} />
    </MemoryRouter>,
    { messages }
  );
  expect(
    screen.getByText('There is currently no entrance for this network.')
  ).toBeVisible();
  expect(screen.queryByRole('link')).toBeNull();
});
