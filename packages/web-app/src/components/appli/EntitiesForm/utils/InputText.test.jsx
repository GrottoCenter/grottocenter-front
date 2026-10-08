import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { useForm } from 'react-hook-form';
import InputText from './InputText';

const TestForm = ({ initialValue = '', onSubmit, ...props }) => {
  const {
    control,
    handleSubmit,
    formState: { errors }
  } = useForm({ mode: 'onChange', defaultValues: { title: initialValue } });

  return (
    <IntlProvider
      locale="en"
      messages={{
        Title: 'Title',
        'form.maxLength': 'Maximum {limit} characters ({count} entered).'
      }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputText
          formKey="title"
          labelName="Title"
          control={control}
          isError={!!errors.title}
          {...props}
        />
        <button type="submit">Save</button>
      </form>
    </IntlProvider>
  );
};

describe('InputText length limits', () => {
  it('shows a counter near the limit and rejects oversized values', async () => {
    const onSubmit = vi.fn();
    render(<TestForm maxLength={10} onSubmit={onSubmit} />);
    const input = screen.getByRole('textbox', { name: 'Title' });

    expect(input).toHaveAttribute('maxLength', '10');
    expect(screen.queryByText('0 / 10')).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '12345678' } });
    expect(await screen.findByText('8 / 10')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'false');
    expect(screen.queryByText(/Maximum/)).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: '12345678901' } });
    fireEvent.click(screen.getByText('Save'));

    expect(
      await screen.findByText('Maximum 10 characters (11 entered).')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows the existing counter for a long field from first render', () => {
    render(<TestForm characterLimit={2000} onSubmit={vi.fn()} />);

    expect(screen.getByText('0 / 2000')).toBeInTheDocument();
  });

  it.each([9, 10])('accepts a short value of %i characters', async length => {
    const onSubmit = vi.fn();
    render(<TestForm maxLength={10} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), {
      target: { value: 'x'.repeat(length) }
    });
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute(
      'aria-invalid',
      'false'
    );
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'x'.repeat(length) }),
        expect.anything()
      )
    );
  });
});
