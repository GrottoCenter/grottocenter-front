import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import Descriptions from './index';

vi.mock('../../../hooks', () => ({
  useAnchorScroll: () => {},
  usePermissions: () => ({ isAuth: false }),
  useCreateDescription: () => ({ mutate: vi.fn() }),
  useMoveDescriptionRelevance: () => ({ mutateAsync: vi.fn() })
}));

vi.mock('../../../hooks/useMoveRelevanceWithUndo', () => ({
  useMoveRelevanceWithUndo: () => ({ movingId: null, handleMove: vi.fn() })
}));

const messages = {
  Description: 'Description',
  'Copy link': 'Copy link',
  'network.descriptions.callout':
    'This entrance is part of {networkLink} which also has {descriptionsLink}.',
  'network.descriptions.count':
    '{count, plural, one {one description} other {# descriptions}}',
  'descriptions.none.entrance': 'No descriptions for this entrance.'
};

const renderDescriptions = networkDescriptionsCount =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <Descriptions
          entityType="entrance"
          entityId={12}
          descriptions={[]}
          networkId={34}
          networkName="Example network"
          networkDescriptionsCount={networkDescriptionsCount}
        />
      </IntlProvider>
    </MemoryRouter>
  );

it('shows network descriptions in a guideline-style callout with both links', () => {
  renderDescriptions(4);

  const networkLink = screen.getByRole('link', { name: 'Example network' });
  const callout = networkLink.closest('.MuiPaper-root');
  expect(callout).toBeInTheDocument();
  expect(getComputedStyle(callout).borderLeftWidth).toBe('3px');
  expect(networkLink).toHaveAttribute('href', '/ui/caves/34');
  expect(screen.getByRole('link', { name: '4 descriptions' })).toHaveAttribute(
    'href',
    '/ui/caves/34#description'
  );
  expect(screen.getByText('No descriptions for this entrance.')).toBeVisible();
});

it('omits the callout when the network has no descriptions', () => {
  renderDescriptions(0);

  expect(screen.queryByRole('link', { name: 'Example network' })).toBeNull();
  expect(
    screen.getByText('No descriptions for this entrance.')
  ).toBeInTheDocument();
});
