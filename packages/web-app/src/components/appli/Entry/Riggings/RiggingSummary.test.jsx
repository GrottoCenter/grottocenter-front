import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import RiggingSummary from './RiggingSummary';
import RiggingTable from './RiggingTable';

vi.mock('./ColumnLegend', () => ({
  default: () => null,
  LegendHeader: ({ children }) => children
}));
vi.mock('../SectionTitle', () => ({
  default: ({ title }) => <h3>{title}</h3>
}));

const messages = {
  'rigging.equipment.hangers': 'bolt hangers',
  'rigging.equipment.carabiners': 'carabiners',
  'rigging.equipment.expansionBolts': 'expansion bolts',
  'rigging.equipment.softAnchors': 'soft anchors (SA)',
  'rigging.equipment.slings': 'accessory cords',
  'rigging.equipment.count': '~{quantity} {equipment}',
  'rigging.equipment.estimate.hangers':
    'Approximate quantity of bolt hangers, from the Anchors cells',
  'rigging.equipment.estimate.carabiners':
    'Approximate quantity of carabiners, from the Anchors cells',
  'rigging.equipment.estimate.expansionBolts':
    'Approximate quantity of expansion bolts, from the Anchors cells',
  'rigging.equipment.estimate.softAnchors':
    'Approximate quantity of soft anchors, from the Anchors cells',
  'rigging.equipment.estimate.slings':
    'Approximate quantity of accessory cords, from the Anchors cells',
  '{count, plural, one {# obstacle} other {# obstacles}}':
    '{count, plural, one {# obstacle} other {# obstacles}}',
  'Approximate total rope length, automatically calculated from rope cells':
    'Approximate total rope length',
  riggings: 'riggings',
  obstacles: 'obstacles',
  ropes: 'ropes',
  anchors: 'anchors',
  observations: 'observations'
};
const row = (anchor, rope = '') => ({
  obstacle: 'P10',
  anchor,
  rope,
  observation: '99S'
});

describe('RiggingSummary', () => {
  it('shows five estimates beside the rope total, including summed ranges', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <RiggingSummary
          obstacles={[
            row('2AF ou 2S', 'C30'),
            row('3 mouskifs + 1G + 2AS', 'C20')
          ]}
          language="fra"
        />
      </IntlProvider>
    );
    const summary = within(screen.getByTestId('rigging-summary'));
    [
      '2 obstacles',
      '50 m',
      '~1–3 bolt hangers',
      '~4–6 carabiners',
      '~1 expansion bolts',
      '~2 soft anchors (SA)',
      '~0–2 accessory cords'
    ].forEach(label => {
      expect(summary.getByText(label)).toBeInTheDocument();
    });
  });

  it('hides unknown and zero counts while leaving the rope summary available', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <RiggingSummary
          obstacles={[row('15 amarrages', 'C30'), row('?', 'en fixe')]}
        />
      </IntlProvider>
    );
    expect(screen.getByText('~30 m')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^rigging-equipment-/)).toHaveLength(0);
  });

  it('uses the sheet language even when the interface is in another language', () => {
    render(
      <IntlProvider locale="de" messages={messages}>
        <RiggingTable
          id={1}
          title="English sheet"
          language="eng"
          obstacles={[row('three EB + one NA')]}
        />
      </IntlProvider>
    );
    expect(screen.getByText('~3 expansion bolts')).toBeInTheDocument();
    expect(screen.getByText('~3 carabiners')).toBeInTheDocument();
    expect(screen.getByText('~1 accessory cords')).toBeInTheDocument();
  });

  it('updates totals when the sheet changes and keeps different sheets independent', () => {
    const view = render(
      <IntlProvider locale="en" messages={messages}>
        <RiggingSummary obstacles={[row('2S')]} />
        <RiggingSummary obstacles={[row('3B')]} />
      </IntlProvider>
    );
    const summaries = screen.getAllByTestId('rigging-summary');
    expect(within(summaries[0]).getByText('~2 carabiners')).toBeInTheDocument();
    expect(within(summaries[1]).getByText('~3 carabiners')).toBeInTheDocument();
    expect(
      within(summaries[1]).queryByText(/bolt hangers/)
    ).not.toBeInTheDocument();
    view.rerender(
      <IntlProvider locale="en" messages={messages}>
        <RiggingSummary obstacles={[row('1dev/G')]} />
      </IntlProvider>
    );
    expect(screen.getByText('~1 carabiners')).toBeInTheDocument();
    expect(screen.getByText('~1 expansion bolts')).toBeInTheDocument();
    expect(screen.getByText('~1 bolt hangers')).toBeInTheDocument();
  });

  it('names each material in full in its French tooltip', () => {
    const frenchMessages = {
      ...messages,
      'rigging.equipment.hangers': 'plaquettes',
      'rigging.equipment.carabiners': 'mousquetons',
      'rigging.equipment.expansionBolts': 'goujons',
      'rigging.equipment.softAnchors': 'AS',
      'rigging.equipment.slings': 'cordelettes',
      'rigging.equipment.estimate.hangers':
        'Quantité approximative de plaquettes, depuis les cases Ancrages',
      'rigging.equipment.estimate.carabiners':
        'Quantité approximative de mousquetons, depuis les cases Ancrages',
      'rigging.equipment.estimate.expansionBolts':
        'Quantité approximative de goujons, depuis les cases Ancrages',
      'rigging.equipment.estimate.softAnchors':
        'Quantité approximative d’amarrages souples, depuis les cases Ancrages',
      'rigging.equipment.estimate.slings':
        'Quantité approximative de cordelettes, depuis les cases Ancrages'
    };
    render(
      <IntlProvider locale="fr" messages={frenchMessages}>
        <RiggingSummary obstacles={[row('1G + 1AS + 1AF')]} />
      </IntlProvider>
    );
    [
      'hangers',
      'carabiners',
      'expansionBolts',
      'softAnchors',
      'slings'
    ].forEach(kind => {
      expect(screen.getByTestId(`rigging-equipment-${kind}`)).toHaveAttribute(
        'aria-label',
        frenchMessages[`rigging.equipment.estimate.${kind}`]
      );
    });
    expect(screen.getByText('~1 plaquettes')).toBeInTheDocument();
    expect(screen.getByText('~1 cordelettes')).toBeInTheDocument();
    expect(screen.getByText('~1 AS')).toBeInTheDocument();
  });

  it('does not show a summary in snapshot comparison mode', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <RiggingTable
          id={1}
          title="Comparison"
          obstacles={[row('2S')]}
          previous={{ obstacles: [row('1S')] }}
        />
      </IntlProvider>
    );
    expect(screen.getByText('Comparison')).toBeInTheDocument();
    expect(screen.queryByTestId('rigging-summary')).not.toBeInTheDocument();
  });
});
