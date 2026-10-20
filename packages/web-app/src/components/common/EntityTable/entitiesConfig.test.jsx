import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { getOrganizationIconSource } from '@/utils/organizationIcons';
import { getPersonIconSource } from '@/utils/personTypes';

import messages from '../../../../public/lang/en.json';
import entitiesConfig from './entitiesConfig';
import { renderCell } from './tableUtils';

it.each(['EDITION', 'SPELEOLOGY', null, undefined, 'FUTURE'])(
  'uses the editor organization type %s in document table cells',
  type => {
    const column = entitiesConfig.documents.columns.find(
      item => item.field === 'editor.name'
    );
    const { container } = render(
      <div>
        {renderCell(
          { editor: { id: 42, name: 'Document publisher', type } },
          column.field,
          column.render
        )}
      </div>
    );
    expect(screen.getByText('Document publisher')).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      getOrganizationIconSource(type)
    );
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(column.sortable).toBe(true);
  }
);

it.each([null, undefined, { id: 42, name: '' }])(
  'keeps the empty document editor %j as a placeholder without an icon',
  editor => {
    const column = entitiesConfig.documents.columns.find(
      item => item.field === 'editor.name'
    );
    const { container } = render(
      <div>{renderCell({ editor }, column.field, column.render)}</div>
    );
    expect(container.textContent).toBe('-');
    expect(container.querySelector('img')).toBeNull();
  }
);

it('uses shared organization icons for organization authors alongside person icons', () => {
  const column = entitiesConfig.documents.columns.find(
    item => item.field === 'authors'
  );
  const { container } = render(
    <IntlProvider locale="en" messages={messages}>
      {renderCell(
        {
          authors: [{ id: 1, nickname: 'Cave author', type: 'AUTHOR' }],
          authorsOrganization: [
            { id: 42, name: 'Caving club', type: 'SPELEOLOGY' }
          ]
        },
        column.field,
        column.render
      )}
    </IntlProvider>
  );
  const icons = container.querySelectorAll('img');
  expect(icons).toHaveLength(2);
  expect(icons[0]).toHaveAttribute('src', getPersonIconSource('AUTHOR'));
  expect(icons[1]).toHaveAttribute(
    'src',
    getOrganizationIconSource('SPELEOLOGY')
  );
  expect(screen.getByText('Caving club')).toBeInTheDocument();
});

it.each(['CAVER', 'AUTHOR', null, 'FUTURE'])(
  'keeps person type %s in its dedicated column and uses a neutral empty value otherwise',
  type => {
    const column = entitiesConfig.persons.columns.find(
      item => item.field === 'type'
    );
    const { container } = render(
      <IntlProvider locale="en" messages={messages}>
        <div>{renderCell({ type }, column.field, column.render)}</div>
      </IntlProvider>
    );
    expect(column.visible).toBe(true);
    if (type === 'CAVER' || type === 'AUTHOR') {
      expect(container.querySelector('img')).toHaveAttribute(
        'src',
        getPersonIconSource(type)
      );
    } else {
      expect(container.textContent).toBe('-');
      expect(container.querySelector('img')).toBeNull();
    }
  }
);

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
