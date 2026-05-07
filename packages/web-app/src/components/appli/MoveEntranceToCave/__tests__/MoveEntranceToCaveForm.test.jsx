import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { IntlProvider } from 'react-intl';

import MoveEntranceToCaveForm from '../MoveEntranceToCaveForm';

// ---- Navigation mock ----
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  // eslint-disable-next-line react/prop-types
  Link: function MockLink({ children, to }) {
    return require('react').createElement('a', { href: to }, children);
  }
}));

// ---- Notification mock ----
const mockOnSuccess = jest.fn();
jest.mock('../../../../hooks/useNotification', () => ({
  useNotification: () => ({
    onSuccess: mockOnSuccess,
    onError: jest.fn(),
    onWarning: jest.fn(),
    onInfo: jest.fn()
  })
}));

// ---- Redux mock ----
const mockDispatch = jest.fn(() => Promise.resolve());
let mockStoreState = {};

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
  useSelector: selector => selector(mockStoreState)
}));

// ---- Action mocks ----
jest.mock('../../../../actions/MoveEntranceToCave', () => ({
  moveEntranceToCave: (entranceId, caveId) => ({
    type: 'MOVE_ENTRANCE_TO_CAVE',
    entranceId,
    caveId
  })
}));

jest.mock('../../../../actions/Entrance/DetachEntrance', () => ({
  detachEntranceToNewCave: jest.fn(() => ({ type: 'DETACH_ENTRANCE' })),
  resetDetachEntrance: jest.fn(() => ({ type: 'DETACH_ENTRANCE_RESET' }))
}));

// ---- Mock child components that are not relevant to this test ----
jest.mock(
  '../../../common/AutoCompleteSearch/CaveAutoCompleteSearch',
  () =>
    function MockCaveAutoCompleteSearch({ onSelection }) {
      return (
        <button
          data-testid="mock-cave-search"
          onClick={() =>
            onSelection({ id: '42', name: 'Destination Cave' })
          }>
          Select Cave
        </button>
      );
    }
);

jest.mock('../Header', () =>
  function MockHeader() {
    return <div data-testid="mock-header">Header</div>;
  }
);

jest.mock('../OperationSummary', () =>
  function MockOperationSummary() {
    return <div data-testid="mock-operation-summary">OperationSummary</div>;
  }
);

jest.mock('../FormActions', () =>
  function MockFormActions({ loading, newCave }) {
    return (
      <div data-testid="mock-form-actions">
        <button type="submit" disabled={loading || !newCave}>
          Move
        </button>
      </div>
    );
  }
);

jest.mock('../DetachEntranceSection', () =>
  function MockDetachEntranceSection() {
    return <div data-testid="mock-detach-section">DetachSection</div>;
  }
);

const messages = {
  'Entrance successfully moved.':
    'Entrance successfully moved.',
  'What do you want to do?': 'What do you want to do?',
  'Link to another network': 'Link to another network',
  'Detach from current network': 'Detach from current network',
  'The entrance is the only one of the cave. Moving it to another existing cave or network will result in deleting it and losing its cave data (depth, discovery year, length, temperature, locations etc.): be careful!':
    'Warning about sole entrance'
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

const defaultMoveState = {
  loading: false,
  error: undefined
};

const defaultDetachState = {
  loading: false,
  error: undefined,
  success: false
};

const renderComponent = (
  moveState = defaultMoveState,
  detachState = defaultDetachState
) => {
  mockStoreState = {
    moveEntranceToCave: moveState,
    detachEntrance: detachState
  };
  return render(
    <IntlProvider locale="en" messages={messages}>
      <MoveEntranceToCaveForm entrance={entrance} />
    </IntlProvider>
  );
};

beforeEach(() => {
  mockDispatch.mockClear();
  mockNavigate.mockClear();
  mockOnSuccess.mockClear();
});

describe('MoveEntranceToCaveForm - navigation and toast on success', () => {
  it('navigates to entrance page after successful move', async () => {
    const { container } = renderComponent();

    // Select a cave — this triggers onNewCaveChange via react-hook-form
    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-cave-search'));
    });

    // Submit the form — newCave should be set after re-render
    const form = container.querySelector('form');
    await act(async () => {
      fireEvent.submit(form);
    });

    // The useEffect triggers when isSubmitSuccessful && !loading && !apiError
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/ui/entrances/123');
    });
  });

  it('shows success toast with cave name after successful move', async () => {
    const { container } = renderComponent();

    // Select a cave
    await act(async () => {
      fireEvent.click(screen.getByTestId('mock-cave-search'));
    });

    // Submit the form
    const form = container.querySelector('form');
    await act(async () => {
      fireEvent.submit(form);
    });

    // The useEffect triggers when isSubmitSuccessful && !loading && !apiError
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        'Entrance successfully moved.'
      );
    });
  });
});
