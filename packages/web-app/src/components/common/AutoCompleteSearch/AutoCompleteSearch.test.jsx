import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { useEntitySearch } from '@/hooks';
import AutoCompleteSearch from './index';
import CaveAutoCompleteSearch from './CaveAutoCompleteSearch';

vi.mock('@/hooks', () => ({
  useEntitySearch: vi.fn()
}));

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

it('keeps same-name cave search results distinct and selectable', async () => {
  const duplicateNames = [
    { id: 1, name: 'TEST CLEMENT', _type: 'caves' },
    { id: 2, name: 'TEST CLEMENT', _type: 'caves' }
  ];
  useEntitySearch.mockReturnValue({
    inputValue: 'TEST',
    setInputValue: vi.fn(),
    results: duplicateNames,
    isLoading: false,
    hasError: false
  });
  const onSelection = vi.fn();
  const consoleError = vi.spyOn(console, 'error');
  render(
    <IntlProvider
      locale="en"
      messages={{
        'No results': 'No results',
        'Search for an entrance or network': 'Search for an entrance or network'
      }}>
      <CaveAutoCompleteSearch label="Search caves" onSelection={onSelection} />
    </IntlProvider>
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox'));
  expect(await screen.findAllByRole('option')).toHaveLength(2);
  await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
  expect(onSelection).toHaveBeenCalledWith(duplicateNames[1]);
  expect(consoleError).not.toHaveBeenCalled();
  consoleError.mockRestore();
});
