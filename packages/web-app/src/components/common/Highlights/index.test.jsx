import { render, screen } from '@testing-library/react';

import { HighLightsChar, HighLightsLine } from './index';

describe('Highlights', () => {
  it('shows removed, added and unchanged words', () => {
    render(
      <HighLightsChar oldText="north entrance" newText="south entrance" />
    );

    expect(screen.getByText('north')).toBeInTheDocument();
    expect(screen.getByText('south')).toBeInTheDocument();
    expect(screen.getByText('entrance')).toBeInTheDocument();
  });

  it('shows removed and added sentences on separate lines', () => {
    const { container } = render(
      <HighLightsLine
        oldText="Old sentence. Shared sentence."
        newText="New sentence. Shared sentence."
      />
    );

    expect(screen.getByText(/- Old sentence\./)).toBeInTheDocument();
    expect(screen.getByText(/\+ New sentence\./)).toBeInTheDocument();
    expect(screen.getByText('Shared sentence.')).toBeInTheDocument();
    expect(container.querySelectorAll('br')).toHaveLength(2);
  });

  it('keeps the available text when a side is missing', () => {
    const { rerender } = render(<HighLightsChar newText="New text" />);

    expect(screen.getByText('New text')).toBeInTheDocument();

    rerender(<HighLightsChar oldText="Old text" />);
    expect(screen.getByText('Old text')).toBeInTheDocument();
  });

  it('optionally identifies changed words without relying on colors or duplicating shared text', () => {
    const { container } = render(
      <HighLightsChar
        oldText="north entrance"
        newText="south entrance"
        showChangeMarkers
      />
    );
    expect(container.querySelector('del')).toHaveTextContent('− north');
    expect(container.querySelector('ins')).toHaveTextContent('+ south');
    expect(screen.getByText('entrance')).toBeInTheDocument();
    expect(container.querySelectorAll('br')).toHaveLength(0);
  });
});
