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
              stats: { approach: 4, caving: 4 },
              timeInfo: {
                eTTrail: '0:30:00',
                eTUnderground: '1:30:00'
              }
            }}
          />
        </IntlProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/30 min/).textContent).toContain('30\u00a0min');
    expect(screen.getByText(/1 h 30/).textContent).toContain(
      '1\u00a0h\u00a030'
    );
  });
});
