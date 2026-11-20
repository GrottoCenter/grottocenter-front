import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { renderWithProviders } from '@/test/renderWithProviders';
import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';
import CreateDescriptionForm from '../Description';
import CreateLocationForm from '../Location';
import CreateHistoryForm from '../History';

vi.mock('@/hooks', () => ({
  useOnlineStatus: () => true,
  useLanguages: () => ({
    isSuccess: true,
    data: [
      { id: 'eng', refName: 'English' },
      { id: 'fra', refName: 'French' }
    ]
  })
}));

const messages = {
  Title: 'Title',
  Text: 'Text',
  Language: 'Language',
  Required: 'Required',
  Create: 'Create',
  Update: 'Update',
  Cancel: 'Cancel',
  English: 'English',
  French: 'French',
  'form.maxLength': 'Maximum {limit} characters ({count} entered).'
};

const forms = [
  ['description', CreateDescriptionForm],
  ['location', CreateLocationForm],
  ['history', CreateHistoryForm]
];

const renderForm = (element, locale = 'en') =>
  renderWithProviders(element, {
    messages,
    store: configureStore({
      reducer: () => ({
        intl: {
          locale,
          AVAILABLE_LANGUAGES: { en: { id: 'eng' }, fr: { id: 'fra' } }
        }
      })
    })
  });

describe.each(forms)('%s text contribution form', (name, Component) => {
  it('submits the expected fields with the current account language', async () => {
    const onSubmit = vi.fn();
    renderForm(
      <Component
        onSubmit={onSubmit}
        isNewDescription
        isNewLocation
        isNewHistory
      />,
      'fr'
    );
    fireEvent.change(screen.getByRole('textbox', { name: /Text/ }), {
      target: { value: 'Contribution body' }
    });
    const expected = { body: 'Contribution body', language: 'fra' };
    if (name === 'history') {
      expect(screen.queryByRole('textbox', { name: /Title/ })).toBeNull();
    } else {
      fireEvent.change(screen.getByRole('textbox', { name: /Title/ }), {
        target: { value: 'Contribution title' }
      });
      expected.title = 'Contribution title';
    }
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(expected, expect.anything())
    );
  });

  it('retains the existing contribution identity and language when editing', async () => {
    const onSubmit = vi.fn();
    const values = {
      id: 14,
      body: 'Original body',
      language: 'fra',
      ...(name === 'history' ? {} : { title: 'Original title' })
    };
    renderForm(
      <Component
        onSubmit={onSubmit}
        values={values}
        isNewDescription={false}
        isNewLocation={false}
        isNewHistory={false}
      />
    );
    fireEvent.change(screen.getByRole('textbox', { name: /Text/ }), {
      target: { value: 'Updated body' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { ...values, body: 'Updated body' },
        expect.anything()
      )
    );
  });
});

it('rejects empty required fields, focuses the title and allows correction', async () => {
  const onSubmit = vi.fn();
  renderForm(<CreateLocationForm onSubmit={onSubmit} isNewLocation />);
  const body = screen.getByRole('textbox', { name: /Text/ });
  const title = screen.getByRole('textbox', { name: /Title/ });
  fireEvent.submit(body.closest('form'));
  await waitFor(() => expect(body).toHaveAttribute('aria-invalid', 'true'));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(title).toHaveFocus();
  fireEvent.change(body, { target: { value: 'Valid body' } });
  fireEvent.change(title, { target: { value: 'Valid title' } });
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
});

it('rejects an oversized prefilled title and accepts the boundary after correction', async () => {
  const onSubmit = vi.fn();
  renderForm(
    <CreateDescriptionForm
      onSubmit={onSubmit}
      isNewDescription={false}
      values={{
        title: 'x'.repeat(TEXT_LENGTH_LIMITS.TITLE + 1),
        body: 'Body',
        language: 'eng'
      }}
    />
  );
  const title = screen.getByRole('textbox', { name: /Title/ });
  fireEvent.submit(title.closest('form'));
  await waitFor(() => expect(title).toHaveAttribute('aria-invalid', 'true'));
  expect(onSubmit).not.toHaveBeenCalled();
  fireEvent.change(title, {
    target: { value: 'x'.repeat(TEXT_LENGTH_LIMITS.TITLE) }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Update' }));
  await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
});

it('retains cancellation while an asynchronous submission is pending', async () => {
  let resolveSubmit;
  const onSubmit = vi.fn(
    () =>
      new Promise(resolve => {
        resolveSubmit = resolve;
      })
  );
  const onCancel = vi.fn();
  renderForm(
    <CreateHistoryForm
      isNewHistory
      onSubmit={onSubmit}
      closeForm={onCancel}
      values={{ body: 'Body', language: 'eng' }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled()
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(onCancel).toHaveBeenCalledOnce();
  await act(async () => resolveSubmit());
  expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
});
