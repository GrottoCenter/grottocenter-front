import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { IntlProvider } from 'react-intl';
import InputCountry from './InputCountry';

const TestForm = ({ onSubmit }) => {
  const { control, handleSubmit } = useForm({
    defaultValues: { country: '' }
  });

  return (
    <IntlProvider
      locale="en"
      messages={{ Country: 'Country', Required: 'Required' }}>
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <InputCountry control={control} formKey="country" />
        <button type="submit">Save</button>
      </form>
    </IntlProvider>
  );
};

it('focuses a required country on submission and allows correction', async () => {
  const onSubmit = vi.fn();
  render(<TestForm onSubmit={onSubmit} />);
  const country = screen.getByRole('combobox', { name: /Country/ });

  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() => expect(country).toHaveFocus());
  expect(country).toHaveAttribute('aria-invalid', 'true');
  expect(country).toHaveAccessibleDescription('Required');
  expect(onSubmit).not.toHaveBeenCalled();

  fireEvent.mouseDown(country);
  fireEvent.click(screen.getByRole('option', { name: 'France' }));
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  await waitFor(() =>
    expect(onSubmit).toHaveBeenCalledWith({ country: 'FR' }, expect.anything())
  );
});
