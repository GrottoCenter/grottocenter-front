import { createElement, useState } from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@mui/material';
import { action } from 'storybook/actions';
import { AUTOCOMPLETE_MIN_CHARACTERS } from '@/conf/config';
import CreatableAutocomplete from './CreatableAutocomplete';

const Example = ({ options, creationActions, loading = false }) => {
  const [value, setValue] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const canCreate =
    inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARACTERS && !loading;
  return (
    <CreatableAutocomplete
      options={options}
      creationActions={canCreate ? creationActions : []}
      value={value}
      inputValue={inputValue}
      loading={loading}
      onChange={(_event, next) => setValue(next)}
      onInputChange={(_event, next) => setInputValue(next)}
      getOptionLabel={option => option.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      noOptionsText={
        inputValue.trim().length >= AUTOCOMPLETE_MIN_CHARACTERS
          ? 'No results'
          : `Type at least ${AUTOCOMPLETE_MIN_CHARACTERS} characters`
      }
      renderOption={(props, option) => createElement('li', props, option.name)}
      renderInput={params =>
        createElement(TextField, { ...params, label: 'Search organizations' })
      }
    />
  );
};

Example.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.number, name: PropTypes.string })
  ).isRequired,
  creationActions: CreatableAutocomplete.propTypes.creationActions,
  loading: PropTypes.bool
};

const organizationAction = {
  id: 'organization',
  iconType: 'organization',
  label: 'Create an organization',
  onClick: action('create organization')
};

const meta = {
  title: 'Common/CreatableAutocomplete',
  component: CreatableAutocomplete,
  args: { options: [], creationActions: [organizationAction] },
  render: args => (
    <Example
      options={args.options}
      creationActions={args.creationActions}
      loading={args.loading}
    />
  )
};
export default meta;

export const NoResults = {};
export const WithResults = {
  args: {
    options: [
      { id: 1, name: 'Caving club' },
      { id: 2, name: 'Library' }
    ]
  }
};
export const Authors = {
  args: {
    creationActions: [
      {
        id: 'person',
        iconType: 'author',
        label: 'Create an author',
        onClick: action('create author')
      },
      organizationAction
    ]
  }
};
export const Loading = { args: { loading: true } };
export const LongList = {
  args: {
    options: Array.from({ length: 30 }, (_value, index) => ({
      id: index + 1,
      name: `Organization ${index + 1}`
    })),
    creationActions: Authors.args.creationActions
  }
};
