import { render, screen, fireEvent } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import DetachEntranceSection from '../DetachEntranceSection';

// ---- Navigation mock ----
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
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
  useDetachEntranceToNewCave: () => ({
    mutate: mockMutate,
    isPending: mockMutationState.isPending,
    error: mockMutationState.error,
    isSuccess: mockMutationState.isSuccess
  })
}));

// The before → after preview is covered by its own suite; keep this one focused
// on the detach button/behaviour (and avoid its internal button-role links).
vi.mock('../OperationSummary', () => ({
  default: function MockOperationSummary() {
    return null;
  }
}));

const messages = {
  'Detach entrance': 'Detach entrance',
  Cancel: 'Cancel',
  'Cannot detach: this entrance is the only one of its cave.':
    'Cannot detach: this entrance is the only one of its cave.',
  'Entrance successfully detached.': 'Entrance successfully detached.',
  'An error occurred while detaching the entrance.':
    'An error occurred while detaching the entrance.'
};

const multiEntranceCave = {
  id: 1,
  name: 'Test Entrance',
  language: 'eng',
  cave: {
    id: 10,
    entrances: [{ id: 1 }, { id: 2 }],
    name: 'Test Cave'
  }
};

const soleEntranceCave = {
  id: 1,
  name: 'Test Entrance',
  language: 'eng',
  cave: {
    id: 10,
    entrances: [{ id: 1 }],
    name: 'Test Cave'
  }
};

const renderComponent = (
  entrance,
  mutationState = { isPending: false, error: null, isSuccess: false }
) => {
  mockMutationState = mutationState;
  return render(
    <IntlProvider locale="en" messages={messages}>
      <DetachEntranceSection entrance={entrance} />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockMutate.mockClear();
  mockNavigate.mockClear();
  mockOnSuccess.mockClear();
});

describe('DetachEntranceSection', () => {
  it('renders enabled button when entrance has multiple cave entrances', () => {
    renderComponent(multiEntranceCave);

    const button = screen.getByRole('button', { name: 'Detach entrance' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('renders disabled button with tooltip when entrance is sole entrance', () => {
    renderComponent(soleEntranceCave);

    const button = screen.getByRole('button', { name: 'Detach entrance' });
    expect(button).toBeDisabled();
  });

  it('clicking button calls useDetachEntranceToNewCave.mutate with the entrance', () => {
    renderComponent(multiEntranceCave);

    const button = screen.getByRole('button', { name: 'Detach entrance' });
    fireEvent.click(button);

    expect(mockMutate).toHaveBeenCalledWith(multiEntranceCave);
  });

  it('shows loading spinner when mutation is pending', () => {
    renderComponent(multiEntranceCave, {
      isPending: true,
      error: null,
      isSuccess: false
    });

    const button = screen.getByRole('button', { name: 'Detach entrance' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('navigates to entrance page on success', () => {
    renderComponent(multiEntranceCave, {
      isPending: false,
      error: null,
      isSuccess: true
    });

    expect(mockNavigate).toHaveBeenCalledWith('/ui/entrances/1');
  });

  it('shows success toast notification on success', () => {
    renderComponent(multiEntranceCave, {
      isPending: false,
      error: null,
      isSuccess: true
    });

    expect(mockOnSuccess).toHaveBeenCalledWith(
      'Entrance successfully detached.'
    );
  });

  it('shows error alert when mutation.error is truthy', () => {
    renderComponent(multiEntranceCave, {
      isPending: false,
      error: new Error('Something went wrong'),
      isSuccess: false
    });

    expect(
      screen.getByText('An error occurred while detaching the entrance.')
    ).toBeInTheDocument();
  });
});
