import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';

import messages from '../../../../public/lang/fr.json';
import RandomEntryCard from './RandomEntryCard';

describe('RandomEntryCard durations', () => {
  it('uses the same duration format as entrance comments', () => {
    render(
      <MemoryRouter>
        <IntlProvider locale="fr" messages={messages}>
          <RandomEntryCard
            fetch={() => {}}
            entry={{
              id: 1,
              name: 'Entrée',
              stats: { aestheticism: 6, approach: 4, caving: 4 },
              timeInfo: {
                eTTrail: '0:30:00',
                eTUnderground: '1:30:00'
              }
            }}
          />
        </IntlProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('Intérêt de la visite')).toBeVisible();
    expect(screen.getByText(/Facilité d'accès à l'entrée/).textContent).toBe(
      "Facilité d'accès à l'entrée (30\u00a0min)"
    );
    expect(
      screen.getByText(/Facilité de progression sous terre/).textContent
    ).toBe('Facilité de progression sous terre (1\u00a0h\u00a030\u00a0min)');
  });
});
