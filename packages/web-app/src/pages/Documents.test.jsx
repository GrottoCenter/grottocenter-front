import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import DocumentsSearchPage from './Documents';

vi.mock('../components/appli/AdvancedSearch/EntitySearchPage', () => ({
  default: ({ initialFilter, children }) => (
    <>
      <div data-testid="page-filter">{JSON.stringify(initialFilter)}</div>
      {children}
    </>
  )
}));

vi.mock('../components/appli/AdvancedSearch/DocumentSearch', () => ({
  default: ({ initialFilter, lockedFilter }) => (
    <div data-testid="form-filter">
      {JSON.stringify({ initialFilter, lockedFilter })}
    </div>
  )
}));

vi.mock('../components/common/NewEntityButton', () => ({
  default: () => null
}));

vi.mock('./EntityCreation/entityConfig', () => ({
  EntityIcon: () => null
}));

it('injects a document reference query as a locked search filter', () => {
  render(
    <MemoryRouter
      initialEntries={[
        '/ui/documents?authorsOrganization.name=Clan+des+Tritons'
      ]}>
      <DocumentsSearchPage />
    </MemoryRouter>
  );

  expect(screen.getByTestId('page-filter')).toHaveTextContent(
    '"authorsOrganization.name":"Clan des Tritons"'
  );
  expect(screen.getByTestId('form-filter')).toHaveTextContent(
    '"lockedFilter":["authorsOrganization.name"]'
  );
});

it('uses no initial or locked filters without document reference query parameters', () => {
  render(
    <MemoryRouter initialEntries={['/ui/documents']}>
      <DocumentsSearchPage />
    </MemoryRouter>
  );

  expect(screen.getByTestId('page-filter')).toHaveTextContent('{}');
  expect(screen.getByTestId('form-filter')).toHaveTextContent(
    '{"initialFilter":{},"lockedFilter":[]}'
  );
});
