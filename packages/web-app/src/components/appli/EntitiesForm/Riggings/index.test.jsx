import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import CreateRiggingsForm from './index';

vi.mock('@/hooks', () => ({ useOnlineStatus: () => true }));
vi.mock('../../../common/LanguageSelect', () => ({
  default: () => <span>Language</span>
}));

const messages = {
  Title: 'Title',
  riggings: 'Riggings',
  obstacles: 'Obstacles',
  ropes: 'Ropes',
  anchors: 'Anchors',
  observations: 'Observations',
  Obstacle: 'Obstacle',
  Rope: 'Rope',
  Anchors: 'Anchors',
  Observations: 'Observations',
  'Add an obstacle': 'Add an obstacle',
  'Anchor notation legend': 'Anchor notation legend',
  'Obstacle notation legend': 'Obstacle notation legend',
  'Notation legends': 'Notation legends',
  'Click to insert': 'Click to insert',
  'Insert a symbol': 'Insert a symbol',
  'Move this line up': 'Move this line up',
  'Move this line down': 'Move this line down',
  'Delete this line': 'Delete this line',
  Create: 'Create',
  'form.maxLength': 'Maximum {limit} characters ({count} entered).'
};

const renderForm = (values, onSubmit) => {
  const store = configureStore({
    reducer: () => ({
      intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'eng' } } }
    })
  });
  return render(
    <Provider store={store}>
      <IntlProvider locale="en" messages={messages}>
        <CreateRiggingsForm values={values} onSubmit={onSubmit} isNew />
      </IntlProvider>
    </Provider>
  );
};

describe.each([
  { layout: 'desktop', isMobile: false },
  { layout: 'mobile', isMobile: true }
])('$layout column counters', ({ isMobile }) => {
  beforeEach(() => {
    vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
      matches: isMobile,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows only near-limit columns below the rows and hides them after correction', () => {
    renderForm(
      {
        title: 'Rigging',
        language: 'eng',
        obstacles: [
          { obstacle: 'a'.repeat(798), rope: '', anchor: '', observation: '' },
          { obstacle: 'b'.repeat(798), rope: '', anchor: '', observation: '' }
        ]
      },
      vi.fn()
    );

    expect(screen.queryByText(/\/ 2000/)).not.toBeInTheDocument();

    const obstacle = screen.getAllByRole('textbox', { name: 'Obstacle' })[1];
    fireEvent.change(obstacle, { target: { value: 'b'.repeat(799) } });

    const counter = screen.getByText('1600 / 2000');
    expect(screen.getAllByText(/\/ 2000/)).toHaveLength(1);
    expect(counter.parentElement).toHaveTextContent('Obstacles');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(obstacle.compareDocumentPosition(counter)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(
      counter.compareDocumentPosition(
        screen.getByRole('button', { name: 'Add an obstacle' })
      )
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    if (!isMobile) {
      screen.getAllByRole('columnheader').forEach(header => {
        expect(header).not.toHaveTextContent(/\/ 2000/);
      });
    }

    fireEvent.change(obstacle, { target: { value: 'b'.repeat(798) } });

    expect(screen.queryByText(/\/ 2000/)).not.toBeInTheDocument();
  });

  it('blocks saving until the combined column length including separators fits', async () => {
    const onSubmit = vi.fn();
    renderForm(
      {
        title: 'Rigging',
        language: 'eng',
        obstacles: [
          { obstacle: 'a'.repeat(999), rope: '', anchor: '', observation: '' },
          { obstacle: 'b'.repeat(999), rope: '', anchor: '', observation: '' }
        ]
      },
      onSubmit
    );

    const submit = screen.getByRole('button', { name: 'Create' });
    expect(screen.getByText('2001 / 2000')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Maximum 2000 characters (2001 entered).'
    );
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getAllByRole('textbox', { name: 'Obstacle' })[1], {
      target: { value: 'b'.repeat(998) }
    });

    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.getByText('2000 / 2000')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    fireEvent.click(submit);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
  });
});
