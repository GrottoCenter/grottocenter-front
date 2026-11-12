import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
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

const renderButton = ({
  isOpen = false,
  onToggle = vi.fn(),
  to,
  onParentClick
} = {}) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        <div role="presentation" onClick={onParentClick}>
          <SectionCreateButton
            isOpen={isOpen}
            onToggle={onToggle}
            to={to}
            label="New"
            tooltip="Add a new description"
            openTooltip="Cancel adding a new description"
          />
        </div>
      </IntlProvider>
    </MemoryRouter>
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
    expect(screen.getByRole('button')).toHaveClass(
      'MuiButton-outlined',
      'MuiButton-colorError'
    );
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

  it('uses the same New button for links without toggling the enclosing card', async () => {
    const onParentClick = vi.fn();
    renderButton({ to: '/ui/entity/add/document', onParentClick });
    const link = screen.getByRole('link', { name: 'New' });
    expect(link).toHaveAttribute('href', '/ui/entity/add/document');
    expect(screen.getByTestId('AddCircleIcon')).toBeInTheDocument();
    await userEvent.setup().click(link);
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('preserves the enclosing card interaction when opening an inline form', async () => {
    const onToggle = vi.fn();
    const onParentClick = vi.fn();
    renderButton({ onToggle, onParentClick });
    await userEvent.setup().click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onParentClick).toHaveBeenCalledOnce();
  });

  it('disables creation links offline', () => {
    setOnLine(false);
    renderButton({ to: '/ui/entity/add/document' });
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });
});
