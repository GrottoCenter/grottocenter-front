import { screen } from '@testing-library/react';

import { renderWithProviders } from '@/test/renderWithProviders';
import messages from '@/../public/lang/fr.json';
import { entityOptionForSelector } from './Entity';

it.each(['Book', { name: 'Book' }])(
  'includes the translated document type in the accessible option (%j)',
  type => {
    renderWithProviders(
      <ul>
        {entityOptionForSelector(
          { role: 'option' },
          {
            _type: 'documents',
            id: 42,
            type,
            title: 'Cave guide',
            description: 'A guide to caves'
          }
        )}
      </ul>,
      { messages, locale: 'fr' }
    );
    expect(
      screen.getByRole('option', {
        name: 'Livre Cave guide 42 A guide to caves · Livre'
      })
    ).toBeVisible();
    expect(screen.getByRole('img', { name: 'Livre' })).toBeVisible();
  }
);

it.each([undefined, -1])('renders an untitled document (type: %j)', type => {
  renderWithProviders(
    <ul>
      {entityOptionForSelector(
        { role: 'option' },
        { _type: 'documents', id: 42, type, description: 'Untitled document' }
      )}
    </ul>
  );
  expect(
    screen.getByRole('option', { name: '42 Untitled document' })
  ).toBeVisible();
});
