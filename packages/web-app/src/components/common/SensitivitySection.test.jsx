import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import SensitivitySection from './SensitivitySection';

const messages = {
  'Sensitivity Management': 'Sensitivity Management',
  'Sensitive massif': 'Sensitive massif',
  'Lock sensitivity': 'Lock sensitivity',
  'Unlock sensitivity': 'Unlock sensitivity'
};

const renderSection = props =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SensitivitySection
        title="Sensitivity Management"
        explanation="Enabling sensitivity cascades to every entrance."
        switchLabel="Sensitive massif"
        isSensitive={false}
        onSensitiveChange={vi.fn()}
        {...props}
      />
    </IntlProvider>
  );

describe('SensitivitySection', () => {
  it('states the consequences above the controls', () => {
    renderSection({});

    const explanation = screen.getByText(
      'Enabling sensitivity cascades to every entrance.'
    );
    const switchControl = screen.getByRole('switch', {
      name: 'Sensitive massif'
    });

    // DOCUMENT_POSITION_FOLLOWING (4) is the only bit that can be set here for
    // two non-nested siblings, so an equality check avoids a bitwise operator.
    expect(explanation.compareDocumentPosition(switchControl)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
  });

  it('hides the padlock from non-administrators', () => {
    renderSection({ showLock: false, isLocked: false });

    expect(
      screen.queryByRole('button', { name: /sensitivity/i })
    ).not.toBeInTheDocument();
  });

  it('shows the padlock to administrators', () => {
    renderSection({ showLock: true, isLocked: false, onLockChange: vi.fn() });

    expect(
      screen.getByRole('button', { name: 'Lock sensitivity' })
    ).toBeInTheDocument();
  });

  it('reports the switch value rather than the event', async () => {
    const onSensitiveChange = vi.fn();
    renderSection({ onSensitiveChange });

    await userEvent.click(
      screen.getByRole('switch', { name: 'Sensitive massif' })
    );

    expect(onSensitiveChange).toHaveBeenCalledWith(true);
  });

  it('disables the switch when asked', () => {
    renderSection({ isSensitiveDisabled: true });

    expect(
      screen.getByRole('switch', { name: 'Sensitive massif' })
    ).toBeDisabled();
  });

  it('renders the alert it is given', () => {
    renderSection({
      alert: { severity: 'warning', content: 'Entrances will be marked.' }
    });

    expect(screen.getByText('Entrances will be marked.')).toBeInTheDocument();
  });
});
