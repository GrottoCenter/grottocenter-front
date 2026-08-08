import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Button } from '@mui/material';
import OfflineDisabled from './OfflineDisabled';

const messages = {
  offlineActionUnavailable: 'Unavailable offline'
};

const setOnLine = value => {
  Object.defineProperty(window.navigator, 'onLine', {
    value,
    configurable: true
  });
};

const renderWrapped = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <OfflineDisabled {...props}>
        <Button fullWidth>Save</Button>
      </OfflineDisabled>
    </IntlProvider>
  );

describe('OfflineDisabled', () => {
  beforeEach(() => setOnLine(true));

  it('renders its child bare while online — no wrapper, no tooltip', () => {
    const { container } = renderWrapped();

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(container.querySelector('span[style]')).not.toBeInTheDocument();
  });

  it('wraps the child in a hoverable span while offline', () => {
    setOnLine(false);
    const { container } = renderWrapped();

    // The span exists because a disabled MUI button sets pointer-events: none
    // and would otherwise never fire the hover the Tooltip listens for.
    const wrapper = container.querySelector('span[style]');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveStyle({ display: 'inline-flex' });
  });

  it('leaves the wrapper shrink-to-fit by default', () => {
    setOnLine(false);
    const { container } = renderWrapped();

    expect(container.querySelector('span[style]')).not.toHaveStyle({
      width: '100%'
    });
  });

  it('stretches the wrapper with fullWidth, so a fullWidth button survives', () => {
    setOnLine(false);
    const { container } = renderWrapped({ fullWidth: true });

    expect(container.querySelector('span[style]')).toHaveStyle({
      width: '100%'
    });
  });
});
