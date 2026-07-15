import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import FormProgressInfo from '../utils/FormProgressInfo';

// --- Helpers ---

const areaErrorMessage =
  'The massif polygon area (12345 km²) exceeds the maximum allowed size of 8000 km².';

const messages = {
  Retry: 'Retry',
  [areaErrorMessage]: areaErrorMessage
};

const renderWithIntl = (ui) =>
  render(
    <MemoryRouter>
      <IntlProvider locale="en" messages={messages}>
        {ui}
      </IntlProvider>
    </MemoryRouter>
  );

// --- Tests ---

describe('MassifForm area validation error display', () => {
  it('displays the specific area validation error message', () => {
    renderWithIntl(
      <FormProgressInfo
        isLoading={false}
        isError={true}
        labelLoading="Creating massif..."
        labelError={areaErrorMessage}
        resetFn={vi.fn()}
        getRedirectFn={() => ''}
      />
    );

    expect(screen.getByText(areaErrorMessage)).toBeInTheDocument();
  });

  it('allows retry after an area validation error', async () => {
    const resetFn = vi.fn();
    const user = userEvent.setup();

    renderWithIntl(
      <FormProgressInfo
        isLoading={false}
        isError={true}
        labelLoading="Creating massif..."
        labelError={areaErrorMessage}
        resetFn={resetFn}
        getRedirectFn={() => ''}
      />
    );

    const retryButton = screen.getByRole('button', { name: 'Retry' });
    expect(retryButton).toBeInTheDocument();

    await user.click(retryButton);
    expect(resetFn).toHaveBeenCalledTimes(1);
  });
});
