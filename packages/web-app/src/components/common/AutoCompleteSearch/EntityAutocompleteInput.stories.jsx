import { Autocomplete } from '@mui/material';
import OrganizationIcon from '@/components/common/OrganizationIcon';
import EntityAutocompleteInput from './EntityAutocompleteInput';

const organization = { id: 1, name: 'Example organization', type: 'EDITION' };

const meta = {
  title: 'Common/EntityAutocompleteInput',
  component: EntityAutocompleteInput,
  args: { label: 'Publisher', placeholder: 'Search for a publisher...' },
  render: args => (
    <Autocomplete
      options={[organization]}
      getOptionLabel={option => option.name}
      renderInput={params => (
        <EntityAutocompleteInput {...args} params={params} />
      )}
    />
  )
};
export default meta;

export const Empty = {};
export const Loading = { args: { loading: true } };
export const SearchFailed = { args: { hasError: true } };
export const ValidationError = {
  args: { required: true, errorMessage: 'Required' }
};
export const Selected = {
  render: args => (
    <Autocomplete
      options={[organization]}
      defaultValue={organization}
      getOptionLabel={option => option.name}
      renderInput={params => (
        <EntityAutocompleteInput
          {...args}
          params={params}
          selectedIcon={
            <OrganizationIcon organizationType="EDITION" size={20} />
          }
        />
      )}
    />
  )
};
