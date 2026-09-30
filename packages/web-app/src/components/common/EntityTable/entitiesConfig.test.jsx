import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import messages from '../../../../public/lang/en.json';
import entitiesConfig from './entitiesConfig';
import { renderCell } from './tableUtils';

it('links guideline rows to their detail page without a description column', () => {
  expect(entitiesConfig.guidelines.link({ id: 42 })).toBe('/ui/guidelines/42');
  expect(
    entitiesConfig.guidelines.columns.some(
      column => column.field === 'description'
    )
  ).toBe(false);
});

it('renders a guideline author as plain text', () => {
  const authorColumn = entitiesConfig.guidelines.columns.find(
    column => column.field === 'author'
  );

  expect(authorColumn.render({ id: 7, nickname: 'Paul' })).toBe('Paul');
});

it('renders search result ratings as stars and values out of five', () => {
  const ratingColumns = entitiesConfig.entrances.columns.filter(column =>
    column.field.startsWith('commentsRating.')
  );
  const entrance = {
    commentsRating: { aestheticism: 7, approach: 8.4, caving: null }
  };

  render(
    <IntlProvider locale="en" messages={messages}>
      <div>
        {ratingColumns.map(column => (
          <div key={column.field}>
            {renderCell(entrance, column.field, column.render)}
          </div>
        ))}
      </div>
    </IntlProvider>
  );

  expect(screen.getByRole('img', { name: '3.5/5' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '4.2/5' })).toBeInTheDocument();
  expect(screen.getByText('3.5/5')).toBeInTheDocument();
  expect(screen.getByText('4.2/5')).toBeInTheDocument();
  expect(screen.getByText('-')).toBeInTheDocument();
});
