import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import SectionCreateButton from './SectionCreateButton';

const messages = {
  Cancel: 'Cancel',
  offlineActionUnavailable: 'Unavailable offline'
};

const setOnLine = value => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true
  });
};

const renderButton = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SectionCreateButton
        isOpen={false}
        onToggle={() => {}}
        label="New"
        tooltip="Add a new description"
        openTooltip="Cancel adding a new description"
        {...props}
      />
    </IntlProvider>
  );

describe('SectionCreateButton', () => {
  beforeEach(() => setOnLine(true));

  it('offers the create label while closed', () => {
    renderButton();
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('New');
  });

  it('turns into Cancel once open', () => {
    renderButton({ isOpen: true });
    const button = screen.getByRole('button');
    expect(button).toBeEnabled();
    expect(button).toHaveTextContent('Cancel');
  });

  // Cancel abandons what is on screen — it is destructive, and reading as plain
  // text made it look like a neutral affordance.
  it('renders the open state in the error colour', () => {
    renderButton({ isOpen: true });
    expect(screen.getByRole('button')).toHaveClass('MuiButton-outlinedError');
  });

  it('blocks opening the panel while offline', () => {
    setOnLine(false);
    renderButton();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // The reason this component exists: closing is local state only. An offline
  // user who opened the panel while online must not be trapped in it.
  it('still lets an open panel be closed while offline', () => {
    setOnLine(false);
    renderButton({ isOpen: true });
    expect(screen.getByRole('button')).toBeEnabled();
  });
});
