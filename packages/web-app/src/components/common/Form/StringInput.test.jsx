import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import StringInput from './StringInput';

const renderInput = props =>
  render(
    <IntlProvider
      locale="en"
      messages={{
        'form.maxLength': 'Maximum {limit} characters ({count} entered).'
      }}>
      <StringInput
        valueName="Title"
        value=""
        onValueChange={vi.fn()}
        {...props}
      />
    </IntlProvider>
  );

describe('StringInput length limits', () => {
  it('limits a short input without showing a counter', () => {
    renderInput({ maxLength: 10 });

    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute(
      'maxLength',
      '10'
    );
    expect(screen.queryByText('0 / 10')).not.toBeInTheDocument();
  });

  it('flags an oversized prefilled value', () => {
    renderInput({ maxLength: 10, value: '12345678901' });

    const error = screen.getByRole('alert');
    const input = screen.getByRole('textbox', { name: 'Title' });
    expect(error).toHaveTextContent('Maximum 10 characters (11 entered).');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input.getAttribute('aria-describedby')).toContain(error.id);
  });

  it('shows a permanent counter for a long field', () => {
    renderInput({ characterLimit: 2000 });

    const counter = screen.getByText('0 / 2000');
    expect(counter).toBeInTheDocument();
    expect(
      screen
        .getByRole('textbox', { name: 'Title' })
        .getAttribute('aria-describedby')
    ).toContain(counter.id);
  });

  it('only displays the short-field limit near the maximum', () => {
    renderInput({ maxLength: 10, value: '12345678' });

    expect(
      screen.getByText('Maximum 10 characters (8 entered).')
    ).toBeInTheDocument();
  });

  it('associates existing help text and a near-limit hint with the input', () => {
    renderInput({
      maxLength: 10,
      value: '12345678',
      helperText: 'An optional title.'
    });

    const input = screen.getByRole('textbox', { name: 'Title' });
    const hint = screen.getByText('Maximum 10 characters (8 entered).');
    const help = screen.getByText('An optional title.');
    expect(input.getAttribute('aria-describedby')).toContain(hint.id);
    expect(input.getAttribute('aria-describedby')).toContain(help.id);
  });
});
