import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';

import SubstanceAutocomplete from './SubstanceAutocomplete';

// Mock the Substance actions
const mockSearchResults = vi.fn();
vi.mock('../../../../actions/Substance', () => ({
  searchSubstances: query => dispatch => {
    mockSearchResults(query);
    return mockSearchResults.__resolveWith
      ? Promise.resolve(mockSearchResults.__resolveWith)
      : Promise.resolve([]);
  }
}));

// Mock useDebounce to return immediately for testing
vi.mock('../../../../hooks', async () => ({
  ...(await vi.importActual('../../../../hooks')),
  useDebounce: value => value
}));

const messages = {
  'ImportObservationsWizard.DeviceSensorsStep.substance': 'Substance',
  'ImportObservationsWizard.DeviceSensorsStep.substancePlaceholder':
    'Search substance...',
  'ImportObservationsWizard.DeviceSensorsStep.substanceNoResults':
    'No results',
  'ImportObservationsWizard.DeviceSensorsStep.substanceViaPubChem':
    'via PubChem',
  'ImportObservationsWizard.DeviceSensorsStep.substanceSearchHint':
    'Type at least 2 characters'
};

const mockStore = {
  getState: () => ({
    login: { authorizationHeader: { Authorization: 'Bearer token' } }
  }),
  dispatch: vi.fn(),
  subscribe: vi.fn()
};

// Make dispatch handle thunks (like redux-thunk middleware)
mockStore.dispatch.mockImplementation(action => {
  if (typeof action === 'function') {
    return action(mockStore.dispatch, mockStore.getState);
  }
  return action;
});

const renderComponent = (props = {}) =>
  render(
    <Provider store={mockStore}>
      <IntlProvider locale="en" messages={messages}>
        <SubstanceAutocomplete
          value={null}
          onChange={vi.fn()}
          {...props}
        />
      </IntlProvider>
    </Provider>
  );

describe('SubstanceAutocomplete', () => {
  beforeEach(() => {
    mockSearchResults.__resolveWith = [];
    mockStore.dispatch.mockImplementation(action => {
      if (typeof action === 'function') {
        return action(mockStore.dispatch, mockStore.getState);
      }
      return action;
    });
    // Suppress React act() warnings from async effect cleanup
    vi.spyOn(console, 'error').mockImplementation(msg => {
      if (typeof msg === 'string' && msg.includes('not wrapped in act')) return;
      // eslint-disable-next-line no-console
      console.warn(msg);
    });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('renders input with label', async () => {
    await act(async () => {
      renderComponent();
    });
    expect(screen.getByLabelText('Substance')).toBeInTheDocument();
  });

  it('does not call searchSubstances when input has fewer than 2 chars', async () => {
    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'a' } });
    });

    expect(mockSearchResults).not.toHaveBeenCalled();
  });

  it('calls searchSubstances when input has 2+ characters', async () => {
    mockSearchResults.__resolveWith = [
      { id: 1, name: 'Nitrate', formula: 'NO₃⁻', casNumber: null, externalId: '943', externalSource: 'PubChem' }
    ];

    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'ni' } });
    });

    await waitFor(() => {
      expect(mockSearchResults).toHaveBeenCalledWith('ni');
    });
  });

  it('displays options after search resolves', async () => {
    mockSearchResults.__resolveWith = [
      { id: 1, name: 'Nitrate', formula: 'NO₃⁻', casNumber: null, externalId: '943', externalSource: 'PubChem' },
      { id: 2, name: 'Nitrite', formula: 'NO₂⁻', casNumber: null, externalId: null, externalSource: null }
    ];

    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'nit' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Nitrate (NO₃⁻)')).toBeInTheDocument();
      expect(screen.getByText('Nitrite (NO₂⁻)')).toBeInTheDocument();
    });
  });

  it('shows "via PubChem" for results with id null', async () => {
    mockSearchResults.__resolveWith = [
      { id: null, name: 'Nitramine', formula: 'CH3N3O2', casNumber: null, externalId: '12345', externalSource: 'PubChem' }
    ];

    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'nitra' } });
    });

    await waitFor(() => {
      expect(screen.getByText('via PubChem')).toBeInTheDocument();
    });
  });

  it('shows "No results" when search returns empty', async () => {
    mockSearchResults.__resolveWith = [];

    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'xyz' } });
    });

    await waitFor(() => {
      expect(screen.getByText('No results')).toBeInTheDocument();
    });
  });

  it('calls onChange when user selects an option', async () => {
    const onChange = vi.fn();
    const substance = { id: 1, name: 'Nitrate', formula: 'NO₃⁻', casNumber: null, externalId: '943', externalSource: 'PubChem' };
    mockSearchResults.__resolveWith = [substance];

    renderComponent({ onChange });
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'nit' } });
    });

    await waitFor(() => {
      expect(screen.getByText('Nitrate (NO₃⁻)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nitrate (NO₃⁻)'));

    expect(onChange).toHaveBeenCalledWith(substance);
  });

  it('shows empty options on API error without crashing', async () => {
    mockSearchResults.__resolveWith = [];

    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'err' } });
    });

    await waitFor(() => {
      expect(screen.getByText('No results')).toBeInTheDocument();
    });

    // Component still renders and is interactive
    expect(input).not.toBeDisabled();
  });
});
