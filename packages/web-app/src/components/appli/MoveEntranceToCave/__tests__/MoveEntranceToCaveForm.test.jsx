import {
  render,
  screen,
  fireEvent,
  waitFor,
  act
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import MoveEntranceToCaveForm from '../MoveEntranceToCaveForm';

// ---- Navigation mock ----
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(''), vi.fn()]
}));

// ---- Notification mock ----
const mockOnSuccess = vi.fn();
vi.mock('../../../../hooks/useNotification', () => ({
  useNotification: () => ({
    onSuccess: mockOnSuccess,
    onError: vi.fn(),
    onWarning: vi.fn(),
    onInfo: vi.fn()
  })
}));

// ---- Mutation mock ----
const mockMutate = vi.fn();
let mockMutationState = { isPending: false, error: null, isSuccess: false };
vi.mock('../../../../hooks', () => ({
  useMoveEntranceToCave: () => ({
    mutate: mockMutate,
    isPending: mockMutationState.isPending,
    error: mockMutationState.error,
    isSuccess: mockMutationState.isSuccess
  })
}));

// ---- Mock child components not relevant to this test ----
vi.mock('../../../common/AutoCompleteSearch/CaveAutoCompleteSearch', () => ({
  default: function MockCaveAutoCompleteSearch({ onSelection }) {
    return (
      <button
        type="button"
        data-testid="mock-cave-search"
        onClick={() => onSelection({ id: '42', name: 'Destination Cave' })}>
        Select Cave
      </button>
    );
  }
}));

vi.mock('../Header', () => ({
  default: function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  }
}));

vi.mock('../OperationSummary', () => ({
  default: function MockOperationSummary() {
    return <div data-testid="mock-operation-summary">OperationSummary</div>;
  }
}));

vi.mock('../DetachEntranceSection', () => ({
  default: function MockDetachEntranceSection() {
    return <div data-testid="mock-detach-section">DetachSection</div>;
  }
}));

vi.mock('../FormActions', () => ({
  default: function MockFormActions({ onConfirm, disabled }) {
    return (
      <button
        type="button"
        data-testid="validate"
        disabled={disabled}
        onClick={onConfirm}>
        Validate
      </button>
    );
  }
}));

const messages = {
  'Entrance successfully moved.': 'Entrance successfully moved.',
  'Link to an existing entrance or network': 'Link to an entrance or network',
  Validate: 'Validate',
  Cancel: 'Cancel',
  'Rather detach the entrance?': 'Rather detach the entrance?'
};

const entrance = {
  id: 123,
  name: 'Test Entrance',
  language: 'eng',
  cave: {
    id: 10,
    entrances: [{ id: 123 }, { id: 456 }],
    name: 'Source Cave'
  }
};

const renderComponent = (
  mutationState = { isPending: false, error: null, isSuccess: false }
) => {
  mockMutationState = mutationState;
  return render(
    <IntlProvider locale="en" messages={messages}>
      <MoveEntranceToCaveForm entrance={entrance} />
    </IntlProvider>
  );
};

const selectAndValidate = async () => {
  await act(async () => {
    fireEvent.click(screen.getByTestId('mock-cave-search'));
  });
  await act(async () => {
    fireEvent.click(screen.getByTestId('validate'));
  });
};

beforeEach(() => {
  mockMutate.mockClear();
  mockNavigate.mockClear();
  mockOnSuccess.mockClear();
});

describe('MoveEntranceToCaveForm - navigation and toast on success', () => {
  it('calls useMoveEntranceToCave.mutate when validating', async () => {
    renderComponent();
    await selectAndValidate();
    expect(mockMutate).toHaveBeenCalledWith({
      entranceId: 123,
      caveId: 42
    });
  });

  it('navigates to entrance page after successful move', async () => {
    renderComponent({ isPending: false, error: null, isSuccess: true });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/ui/entrances/123');
    });
  });

  it('shows success toast after successful move', async () => {
    renderComponent({ isPending: false, error: null, isSuccess: true });
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        'Entrance successfully moved.'
      );
    });
  });
});
