import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  QueryClient,
  QueryClientProvider,
  MutationCache
} from '@tanstack/react-query';
import { action } from 'storybook/actions';
import RelatedEntityDialog from './RelatedEntityDialog';

const Example = ({
  entityType = 'organizations',
  defaultName = '',
  defaultType = ''
}) => {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
      // Preview interactions must never write to the real API.
      mutationCache: new MutationCache({
        onMutate: () => {
          throw new Error('Storybook preview');
        }
      })
    });
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <RelatedEntityDialog
        entityType={entityType}
        defaultName={defaultName}
        defaultType={defaultType}
        onSelect={action('selected')}
        onClose={action('closed')}
      />
    </QueryClientProvider>
  );
};
Example.propTypes = {
  entityType: PropTypes.oneOf(['persons', 'organizations']),
  defaultName: PropTypes.string,
  defaultType: PropTypes.string
};

const meta = {
  title: 'Forms/RelatedEntityDialog',
  component: RelatedEntityDialog,
  render: args => (
    <Example
      entityType={args.entityType}
      defaultName={args.defaultName}
      defaultType={args.defaultType}
    />
  )
};
export default meta;
export const Organization = {
  args: {
    entityType: 'organizations',
    defaultName: 'Example organization',
    defaultType: 'EDITION'
  }
};
export const Person = {
  args: { entityType: 'persons', defaultName: 'Jane Doe' }
};
