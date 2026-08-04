import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import UpdatePrompt from './UpdatePrompt';

const useRegisterSWMock = vi.fn();
const updateServiceWorkerMock = vi.fn();
const setNeedRefreshMock = vi.fn();

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: (...args) => useRegisterSWMock(...args)
}));

const messages = {
  Update: 'Update',
  Later: 'Later',
  'A new version is available': 'A new version is available'
};

const renderUpdatePrompt = () =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <UpdatePrompt />
    </IntlProvider>
  );

const mockRegisterSW = ({ needRefresh }) => {
  useRegisterSWMock.mockReturnValue({
    needRefresh: [needRefresh, setNeedRefreshMock],
    updateServiceWorker: updateServiceWorkerMock
  });
};

describe('UpdatePrompt', () => {
  beforeEach(() => {
    useRegisterSWMock.mockReset();
    updateServiceWorkerMock.mockReset();
    setNeedRefreshMock.mockReset();
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

  it('calls updateServiceWorker when the Update button is clicked', () => {
    mockRegisterSW({ needRefresh: true });
    renderUpdatePrompt();

    fireEvent.click(screen.getByTestId('update-app-btn'));

    expect(updateServiceWorkerMock).toHaveBeenCalledTimes(1);
  });

  it('dismisses the snackbar when the Later button is clicked', () => {
    mockRegisterSW({ needRefresh: true });
    renderUpdatePrompt();

    fireEvent.click(screen.getByLabelText('Later'));

    expect(setNeedRefreshMock).toHaveBeenCalledWith(false);
  });
});
