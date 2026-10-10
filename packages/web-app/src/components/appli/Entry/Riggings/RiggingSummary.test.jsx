import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import frenchMessages from '@/../public/lang/fr.json';
import RiggingSummary from './RiggingSummary';
import RiggingTable from './RiggingTable';

vi.mock('./ColumnLegend', () => ({
  default: () => null,
  LegendHeader: ({ children }) => children
}));
vi.mock('../SectionTitle', () => ({
  default: ({ title }) => <h3>{title}</h3>
}));

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
      '~1 expansion bolt',
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
    expect(screen.getByText('~1 accessory cord')).toBeInTheDocument();
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
    expect(screen.getByText('~1 carabiner')).toBeInTheDocument();
    expect(screen.getByText('~1 expansion bolt')).toBeInTheDocument();
    expect(screen.getByText('~1 bolt hanger')).toBeInTheDocument();
  });

  it('names each material in full in its French tooltip', () => {
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
    expect(screen.getByText('~1 plaquette')).toBeInTheDocument();
    expect(screen.getByText('~1 cordelette')).toBeInTheDocument();
    expect(screen.getByText('~1 AS')).toBeInTheDocument();
  });

  it.each(['1 S + plaquette', '1G + 1 hanger', '?', '1 Pulse'])(
    'keeps only the approximate marker when the sheet contains %s',
    anchor => {
      render(
        <IntlProvider locale="en" messages={messages}>
          <RiggingSummary obstacles={[row('1B'), row(anchor)]} />
        </IntlProvider>
      );
      expect(
        screen.getByTestId('rigging-equipment-carabiners')
      ).toHaveAttribute(
        'aria-label',
        messages['rigging.equipment.estimate.carabiners']
      );
      expect(
        screen.getByTestId('rigging-equipment-carabiners')
      ).toHaveTextContent(/^~/);
    }
  );

  it('uses the upper range bound for grammatical number', () => {
    render(
      <IntlProvider locale="en" messages={messages}>
        <RiggingSummary obstacles={[row('1AS ou 1G')]} />
      </IntlProvider>
    );
    expect(screen.getByText('~0–1 bolt hanger')).toBeInTheDocument();
    expect(screen.getByText('~0–1 soft anchor (SA)')).toBeInTheDocument();
  });

  it('recalculates spelled-out quantities when only the sheet language changes', () => {
    const obstacles = [row('two EB')];
    const view = render(
      <IntlProvider locale="en" messages={messages}>
        <RiggingSummary obstacles={obstacles} language="eng" />
      </IntlProvider>
    );
    expect(screen.getByText('~2 expansion bolts')).toBeInTheDocument();
    view.rerender(
      <IntlProvider locale="en" messages={messages}>
        <RiggingSummary obstacles={obstacles} language="fra" />
      </IntlProvider>
    );
    expect(screen.getByText('~1 expansion bolt')).toBeInTheDocument();
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
