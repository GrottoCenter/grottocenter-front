import { useState } from 'react';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider
} from '@tanstack/react-query';
import { action } from 'storybook/actions';
import OrganizationSelect from './index';

const Example = ({
  value: initialValue = null,
  onChange,
  onSearchChange,
  ...props
}) => {
  const [value, setValue] = useState(initialValue);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false } },
        // The real search can be explored; previews must never create API records.
        mutationCache: new MutationCache({
          onMutate: () => {
            throw new Error('Storybook preview');
          }
        })
      })
  );
  return (
    <QueryClientProvider client={client}>
      <OrganizationSelect
        {...props}
        value={value}
        onChange={organization => {
          setValue(organization);
          onChange(organization);
        }}
        onSearchChange={
          onSearchChange &&
          (query => {
            setValue(null);
            onSearchChange(query);
          })
        }
      />
    </QueryClientProvider>
  );
};
Example.propTypes = OrganizationSelect.propTypes;

const organization = { id: 42, name: 'Example organization', type: 'EDITION' };
const meta = {
  title: 'Forms/OrganizationSelect',
  component: OrganizationSelect,
  args: { onChange: action('organization selected') },
  render: args => <Example {...args} />
};
export default meta;

export const Empty = {};
export const Publisher = {
  args: { value: organization, label: 'Publisher', defaultType: 'EDITION' }
};
export const Association = {
  args: {
    value: organization,
    required: true,
    clearOnBlur: false,
    onSearchChange: action('search abandons the previous selection')
  }
};
export const CreationDisabled = { args: { allowCreation: false } };
export const ValidationError = {
  args: { required: true, errorMessage: 'Required' }
};
export const Disabled = { args: { value: organization, disabled: true } };
