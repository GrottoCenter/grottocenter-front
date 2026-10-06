import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import AutoCompleteSearch from './index';

const suggestions = [
  { id: 1, name: 'Cave one' },
  { id: 2, name: 'Cave two' }
];

it('keeps input focus and keyboard selection with the MUI input slots', async () => {
  const onSelection = vi.fn();
  const Search = () => {
    const [inputValue, setInputValue] = useState('');
    return (
      <AutoCompleteSearch
        suggestions={suggestions}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSelection={onSelection}
        label="Search caves"
        noOptionsText="No results"
        value={null}
      />
    );
  };

  render(
    <IntlProvider locale="en" messages={{}}>
      <Search />
    </IntlProvider>
  );
  const user = userEvent.setup();
  const input = screen.getByRole('combobox');
  await user.type(input, 'Cave');
  expect(input).toHaveFocus();
  expect(await screen.findAllByRole('option')).toHaveLength(2);
  await user.keyboard('{ArrowDown}{Enter}');
  expect(onSelection).toHaveBeenCalledWith(suggestions[0]);
});
