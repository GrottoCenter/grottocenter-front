import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import SectionTitle from './SectionTitle';

describe('SectionTitle', () => {
  it('allows long deleted titles to wrap while keeping the deletion label and anchor', () => {
    const title = 'A'.repeat(200);
    render(
      <IntlProvider
        locale="en"
        messages={{ deleted: 'deleted', 'Copy link': 'Copy link' }}>
        <SectionTitle title={title} anchorId="rigging-1" isDeleted />
      </IntlProvider>
    );

    const heading = screen.getByText(title).closest('.MuiTypography-root');
    expect(getComputedStyle(heading).display).toBe('inline');
    expect(getComputedStyle(heading).overflowWrap).toBe('anywhere');
    expect(getComputedStyle(heading).whiteSpace).not.toBe('nowrap');
    expect(screen.getByText(/\[deleted\]/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Copy link' })
    ).toBeInTheDocument();
    expect(document.getElementById('rigging-1')).toBeInTheDocument();
  });
});
