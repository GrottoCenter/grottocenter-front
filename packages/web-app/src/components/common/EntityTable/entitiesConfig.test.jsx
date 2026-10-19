import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { getOrganizationIconSource } from '@/utils/organizationIcons';

import messages from '../../../../public/lang/en.json';
import entitiesConfig from './entitiesConfig';
import { renderCell } from './tableUtils';

it.each(['EDITION', null, undefined, '', 'FUTURE'])(
  'renders known type %s with its icon, otherwise the standard empty cell',
  type => {
    const nameColumn = entitiesConfig.organizations.columns.find(
      column => column.field === 'name'
    );
    const organization = { id: 42, name: 'An organization', type };
    const typeColumn = entitiesConfig.organizations.columns.find(
      column => column.field === 'type'
    );
    const { container } = render(
      <IntlProvider locale="en" messages={messages}>
        <div data-testid="organization-name">
          {renderCell(organization, nameColumn.field, nameColumn.render)}
        </div>
        <div data-testid="organization-type">
          {renderCell(organization, typeColumn.field, typeColumn.render)}
        </div>
      </IntlProvider>
    );
    expect(screen.getByText('An organization')).toBeInTheDocument();
    expect(
      screen.getByTestId('organization-name').querySelector('img')
    ).toBeNull();
    if (type === 'EDITION') {
      expect(screen.getByTestId('organization-type')).toHaveTextContent(
        'Publisher'
      );
      expect(container.querySelectorAll('img')).toHaveLength(1);
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        getOrganizationIconSource(type)
      );
    } else {
      expect(screen.getByTestId('organization-type').textContent).toBe('-');
      expect(container.querySelector('img')).toBeNull();
    }
    expect(entitiesConfig.organizations.icon).toBeUndefined();
    expect(typeColumn.visible).toBe(true);
  }
);

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
