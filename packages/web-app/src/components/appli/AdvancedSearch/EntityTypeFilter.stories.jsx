import { useState } from 'react';
import {
  getOrganizationTypeLabelId,
  ORGANIZATION_TYPE_VALUES
} from '@/utils/organizationTypes';
import EntityTypeFilter from './EntityTypeFilter';

const Example = () => {
  const [value, setValue] = useState('');
  return (
    <EntityTypeFilter
      value={value}
      onChange={setValue}
      options={[
        { value: '', labelId: 'All' },
        ...ORGANIZATION_TYPE_VALUES.map(type => ({
          value: type,
          labelId: getOrganizationTypeLabelId(type)
        }))
      ]}
    />
  );
};
const meta = { title: 'Search/EntityTypeFilter', component: EntityTypeFilter };
export default meta;
export const Organizations = { render: () => <Example /> };
