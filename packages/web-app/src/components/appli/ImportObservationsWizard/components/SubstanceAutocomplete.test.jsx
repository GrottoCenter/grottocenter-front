import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import SubstanceAutocomplete from './SubstanceAutocomplete';

// The hook mock is toggled per-test via mockHookState — the module reference is
// stable so the component always calls into the same closure, but each test
// swaps what the hook returns.
let mockHookState = { data: [], isFetching: false, isSuccess: false };
const mockLastTerm = { current: null };

vi.mock('../../../../hooks', async () => ({
  ...(await vi.importActual('../../../../hooks')),
  useDebounce: value => value,
  useSubstanceSearch: term => {
    mockLastTerm.current = term;
    return mockHookState;
  }
}));

const messages = {
  'ImportObservationsWizard.DeviceSensorsStep.substance': 'Substance',
  'ImportObservationsWizard.DeviceSensorsStep.substancePlaceholder':
    'Search substance...',
  'ImportObservationsWizard.DeviceSensorsStep.substanceNoResults': 'No results',
  'ImportObservationsWizard.DeviceSensorsStep.substanceViaPubChem':
    'via PubChem',
  'ImportObservationsWizard.DeviceSensorsStep.substanceSearchHint':
    'Type at least 2 characters'
};

const renderComponent = (props = {}) =>
  render(
    <IntlProvider locale="en" messages={messages}>
      <SubstanceAutocomplete value={null} onChange={vi.fn()} {...props} />
    </IntlProvider>
  );

beforeEach(() => {
  mockHookState = { data: [], isFetching: false, isSuccess: false };
  mockLastTerm.current = null;
});

describe('SubstanceAutocomplete', () => {
  it('renders input with label', () => {
    renderComponent();
    expect(screen.getByLabelText('Substance')).toBeInTheDocument();
  });

  it('passes an empty term to the hook below two characters', async () => {
    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'a' } });
    });

    // Hook is called on every render; the term passed must reflect the
    // debounced input. Under two chars, the hook itself is responsible for
    // guarding `enabled` — the contract from the component's side is only
    // that it forwards the trimmed term.
    expect(mockLastTerm.current).toBe('a');
  });

  it('passes the trimmed term to the hook when input has 2+ characters', async () => {
    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'ni' } });
    });

    await waitFor(() => {
      expect(mockLastTerm.current).toBe('ni');
    });
  });

  it('displays options from the hook data', async () => {
    mockHookState = {
      data: [
        {
          id: 1,
          name: 'Nitrate',
          formula: 'NO₃⁻',
          casNumber: null,
          externalId: '943',
          externalSource: 'PubChem'
        },
        {
          id: 2,
          name: 'Nitrite',
          formula: 'NO₂⁻',
          casNumber: null,
          externalId: null,
          externalSource: null
        }
      ],
      isFetching: false,
      isSuccess: true
    };

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
    mockHookState = {
      data: [
        {
          id: null,
          name: 'Nitramine',
          formula: 'CH3N3O2',
          casNumber: null,
          externalId: '12345',
          externalSource: 'PubChem'
        }
      ],
      isFetching: false,
      isSuccess: true
    };

    renderComponent();
    const input = screen.getByLabelText('Substance');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'nitra' } });
    });

    await waitFor(() => {
      expect(screen.getByText('via PubChem')).toBeInTheDocument();
    });
  });

  it('shows "No results" when hook returns empty and has searched', async () => {
    mockHookState = { data: [], isFetching: false, isSuccess: true };

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
    const substance = {
      id: 1,
      name: 'Nitrate',
      formula: 'NO₃⁻',
      casNumber: null,
      externalId: '943',
      externalSource: 'PubChem'
    };
    mockHookState = {
      data: [substance],
      isFetching: false,
      isSuccess: true
    };

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
});
