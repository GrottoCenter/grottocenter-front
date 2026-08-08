import { render, screen, fireEvent, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { SnackbarProvider } from 'notistack';
import UpdatePrompt from './UpdatePrompt';

const useRegisterSWMock = vi.fn();
const setNeedRefreshMock = vi.fn();

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (...args) => useRegisterSWMock(...args)
}));

const messages = {
  Update: 'Update',
  Later: 'Later',
  'A new version is available': 'A new version is available'
};

// UpdatePrompt renders nothing itself — the prompt goes through the app-wide
// notistack stack, so the provider is what puts it in the DOM.
const renderUpdatePrompt = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SnackbarProvider>
        <UpdatePrompt />
      </SnackbarProvider>
    </IntlProvider>
  );

const mockRegisterSW = ({ needRefresh, waitingSW = null }) => {
  let delivered = false;
  useRegisterSWMock.mockImplementation(options => {
    // Deliver the registration once, asynchronously, so the setState it
    // triggers doesn't cascade into an infinite re-render during the current
    // render pass.
    if (!delivered) {
      delivered = true;
      queueMicrotask(() =>
        options?.onRegisteredSW?.('sw.js', { waiting: waitingSW })
      );
    }
    return {
      needRefresh: [needRefresh, setNeedRefreshMock],
      updateServiceWorker: vi.fn()
    };
  });
};

describe('UpdatePrompt', () => {
  beforeEach(() => {
    useRegisterSWMock.mockReset();
    setNeedRefreshMock.mockReset();
    // Stub the SW container just enough for the component to attach listeners.
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }
    });
  });

  it('renders nothing visible when no refresh is needed', () => {
    mockRegisterSW({ needRefresh: false });
    renderUpdatePrompt();

    expect(
      screen.queryByText('A new version is available')
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('update-app-btn')).not.toBeInTheDocument();
  });

  it('renders the snackbar with both actions when a refresh is needed', () => {
    mockRegisterSW({ needRefresh: true });
    renderUpdatePrompt();

    expect(screen.getByText('A new version is available')).toBeInTheDocument();
    expect(screen.getByTestId('update-app-btn')).toBeInTheDocument();
    expect(screen.getByLabelText('Later')).toBeInTheDocument();
  });

  it('posts SKIP_WAITING to the waiting SW when Update is clicked', async () => {
    const postMessageMock = vi.fn();
    mockRegisterSW({
      needRefresh: true,
      waitingSW: { postMessage: postMessageMock }
    });
    renderUpdatePrompt();

    // Let the deferred onRegisteredSW callback resolve (setRegistration).
    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByTestId('update-app-btn'));

    expect(postMessageMock).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(navigator.serviceWorker.addEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
      { once: true }
    );
  });

  it('dismisses the snackbar when the Later button is clicked', () => {
    mockRegisterSW({ needRefresh: true });
    renderUpdatePrompt();

    fireEvent.click(screen.getByLabelText('Later'));

    expect(setNeedRefreshMock).toHaveBeenCalledWith(false);
  });

  it('dismisses the snackbar when Update is clicked with no waiting SW', async () => {
    mockRegisterSW({ needRefresh: true, waitingSW: null });
    renderUpdatePrompt();

    await act(async () => {
      await Promise.resolve();
    });

    fireEvent.click(screen.getByTestId('update-app-btn'));

    expect(setNeedRefreshMock).toHaveBeenCalledWith(false);
  });
});
