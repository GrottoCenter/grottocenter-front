import React from 'react';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import OperationSummary from '../OperationSummary';

// NetworkInlineLink relies on router/media hooks; render just its label as text.
vi.mock('../../../common/NetworkInlineLink', () => ({
  default: function MockNetworkInlineLink({ label }) {
    return React.createElement('span', null, label);
  }
}));

// The sibling-name lookup hits Redux + the network; stub it (null → fallback).
vi.mock('../../../../hooks', () => ({
  useOtherEntranceName: () => null
}));

const messages = {
  Now: 'Now',
  After: 'After',
  'network.entranceCount':
    '({count, plural, one {# entrance} other {# entrances}})',
  'Independent entrance': 'Independent entrance',
  'Becomes independent': 'Becomes independent',
  'The other entrance': 'The other entrance',
  'Now includes {name}': 'Now includes {name}',
  'To be selected': 'To be selected'
};

const renderPreview = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <OperationSummary {...props} />
    </IntlProvider>
  );

const caveWith = (n, extra = {}) => ({
  id: 10,
  name: 'Source',
  entrances: Array.from({ length: n }, (_, i) => ({ id: i + 1 })),
  ...extra
});

describe('OperationSummary', () => {
  it('detaching a 2-entrance network yields two independent entrances', () => {
    renderPreview({
      variant: 'detach',
      entrance: { id: 1, name: 'P40', language: 'eng', cave: caveWith(2) }
    });

    // The detached entrance becomes independent…
    expect(screen.getByText('P40')).toBeInTheDocument();
    expect(screen.getByText('Independent entrance')).toBeInTheDocument();
    // …and the remaining entrance (not the network name) also becomes
    // independent — here the fallback label since the hook is stubbed.
    expect(screen.getByText('The other entrance')).toBeInTheDocument();
    expect(screen.getByText('Becomes independent')).toBeInTheDocument();
  });

  it('linking network → network decrements source and increments target', () => {
    renderPreview({
      variant: 'link',
      entrance: { id: 1, name: 'P40', language: 'eng', cave: caveWith(5) },
      newCave: { id: 20, name: 'Target', nbEntrances: 3 }
    });

    // Source loses one (5 → 4), target gains one (3 → 4); counts sit next to
    // the network name, not inside the link.
    expect(screen.getByText('(5 entrances)')).toBeInTheDocument();
    expect(screen.getByText('(3 entrances)')).toBeInTheDocument();
    expect(screen.getAllByText('(4 entrances)')).toHaveLength(2);
    expect(screen.getByText('Now includes P40')).toBeInTheDocument();
  });

  it('linking a solo source drops it from the "after" side (no dissolve)', () => {
    renderPreview({
      variant: 'link',
      entrance: { id: 1, name: 'Solo', language: 'eng', cave: caveWith(1) },
      newCave: { id: 20, name: 'Target', nbEntrances: 3 }
    });

    // Only the target remains after (3 → 4); the solo source is gone (deleted).
    expect(screen.getByText('(4 entrances)')).toBeInTheDocument();
    expect(screen.getByText('Now includes Solo')).toBeInTheDocument();
    expect(screen.queryByText('Becomes independent')).not.toBeInTheDocument();
  });

  it('shows a placeholder on the "after" side until a target is picked', () => {
    renderPreview({
      variant: 'link',
      entrance: { id: 1, name: 'P40', language: 'eng', cave: caveWith(5) },
      newCave: null
    });

    expect(screen.getByText('To be selected')).toBeInTheDocument();
  });
});
