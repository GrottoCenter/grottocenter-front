import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import messages from '../../../../../public/lang/en.json';
import CreateCommentForm from './index';

vi.mock('../../../../hooks', () => ({
  useLanguages: () => ({
    data: [{ id: 'en', refName: 'English' }],
    isSuccess: true
  }),
  useOnlineStatus: () => true
}));

const state = {
  intl: { locale: 'en', AVAILABLE_LANGUAGES: { en: { id: 'en' } } }
};

const store = {
  getState: () => state,
  subscribe: () => () => {},
  dispatch: () => {}
};

const renderForm = (onSubmit, values = undefined, isNewComment = true) =>
  render(
    <Provider store={store}>
      <IntlProvider locale="en" messages={messages}>
        <CreateCommentForm
          isNewComment={isNewComment}
          onSubmit={onSubmit}
          values={values}
        />
      </IntlProvider>
    </Provider>
  );

describe('CreateCommentForm', () => {
  it('submits interest on the existing API scale', async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    expect(
      screen.getByRole('textbox', { name: 'Approach time — Hours' })
    ).toBeVisible();
    expect(screen.getByRole('group', { name: 'Ease of move' })).toBeVisible();
    expect(screen.getByRole('group', { name: 'Ease of reach' })).toBeVisible();

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'A memorable route' }
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: /describe your visit/i }),
      {
        target: { value: 'Visited the main passage.' }
      }
    );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Interest rating' })).getByRole(
        'radio',
        { name: '4 out of 5 stars' }
      )
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Approach time — Hours' }),
      { target: { value: '1' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Approach time — Minutes' }),
      { target: { value: '15' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Underground time — Hours' }),
      { target: { value: '26' } }
    );
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Underground time — Minutes' }),
      { target: { value: '30' } }
    );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Ease of move' })).getByRole(
        'radio',
        { name: '2 out of 5 stars' }
      )
    );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Ease of reach' })).getByRole(
        'radio',
        { name: '5 out of 5 stars' }
      )
    );
    expect(screen.getByText(/2 \/ 5.*Difficult/)).toBeInTheDocument();
    expect(screen.getByText(/5 \/ 5.*Very easy/)).toBeInTheDocument();
    expect(screen.getByText('4 / 5 · Remarkable')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          aestheticism: 8,
          eTTrail: 75,
          eTUnderground: 1590,
          caving: 4,
          approach: 10
        }),
        expect.anything()
      )
    );
  });

  it('preserves a historical half-star rating when editing', async () => {
    const onSubmit = vi.fn();
    renderForm(
      onSubmit,
      {
        id: 7,
        title: 'Existing comment',
        body: 'A visited route',
        language: 'en',
        aestheticism: 9,
        caving: 7,
        approach: 3,
        eTTrail: '1:45:00',
        eTUnderground: '26:30:00'
      },
      false
    );

    expect(
      screen.getByText('4.5 / 5 · Remarkable – Exceptional')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Approach time — Hours' })
    ).toHaveValue('1');
    expect(
      screen.getByRole('textbox', { name: 'Approach time — Minutes' })
    ).toHaveValue('45');
    expect(
      screen.getByRole('textbox', { name: 'Underground time — Hours' })
    ).toHaveValue('26');
    expect(
      screen.getByText(/3.5 \/ 5.*Intermediate.*Easy/)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          aestheticism: 9,
          caving: 7,
          approach: 3,
          eTTrail: 105,
          eTUnderground: 1590
        }),
        expect.anything()
      )
    );
  });

  it('rejects out-of-range minutes and keeps an empty duration unset', async () => {
    const onSubmit = vi.fn();
    renderForm(onSubmit);

    fireEvent.change(screen.getByRole('textbox', { name: /title/i }), {
      target: { value: 'Test comment' }
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: /describe your visit/i }),
      { target: { value: 'A short trip.' } }
    );
    const minutes = screen.getByRole('textbox', {
      name: 'Approach time — Minutes'
    });
    fireEvent.change(minutes, { target: { value: '60' } });
    expect(minutes).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ eTTrail: null, eTUnderground: null }),
        expect.anything()
      )
    );
  });
});
