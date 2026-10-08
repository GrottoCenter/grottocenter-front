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

  it.each([8, 10])('shows only a neutral counter at %i characters', count => {
    renderInput({ maxLength: 10, value: 'x'.repeat(count) });

    expect(screen.getByText(`${count} / 10`)).toBeInTheDocument();
    expect(screen.queryByText(/Maximum/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveAttribute(
      'aria-invalid',
      'false'
    );
  });

  it('associates existing help text and the near-limit counter with the input', () => {
    renderInput({
      maxLength: 10,
      value: '12345678',
      helperText: 'An optional title.'
    });

    const input = screen.getByRole('textbox', { name: 'Title' });
    const counter = screen.getByText('8 / 10');
    const help = screen.getByText('An optional title.');
    expect(input.getAttribute('aria-describedby')).toContain(counter.id);
    expect(input.getAttribute('aria-describedby')).toContain(help.id);
  });
});
