import { fireEvent, render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import messages from '@/../public/lang/en.json';
import { SearchBooleanToggle } from './SearchElements';

it.each([
  [true, 'Yes'],
  [false, 'No']
])('preserves the legacy two-choice toggle for %s', (value, label) => {
  const onChange = vi.fn();
  render(
    <IntlProvider locale="en" messages={messages}>
      <SearchBooleanToggle
        label="Diving cave"
        value={value}
        onChange={onChange}
      />
    </IntlProvider>
  );
  expect(screen.getAllByRole('button')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: label }));
  expect(onChange).toHaveBeenLastCalledWith(null);
});
