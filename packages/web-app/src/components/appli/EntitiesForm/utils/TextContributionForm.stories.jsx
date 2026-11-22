import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { action } from 'storybook/actions';
import { referenceKeys } from '@/api/queryKeys';
import TextContributionForm from './TextContributionForm';

const Example = ({ hasTitle, isNew, values }) => {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    queryClient.setQueryDefaults(referenceKeys.languages(), { enabled: false });
    queryClient.setQueryData(referenceKeys.languages(), [
      { id: 'eng', refName: 'English' },
      { id: 'fra', refName: 'French' }
    ]);
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <TextContributionForm
        hasTitle={hasTitle}
        isNew={isNew}
        values={values}
        onSubmit={action('submit')}
        closeForm={action('cancel')}
      />
    </QueryClientProvider>
  );
};
Example.propTypes = {
  hasTitle: TextContributionForm.propTypes.hasTitle,
  isNew: TextContributionForm.propTypes.isNew,
  values: TextContributionForm.propTypes.values
};

const meta = {
  title: 'Forms/TextContributionForm',
  component: TextContributionForm,
  args: { hasTitle: true, isNew: true },
  render: ({ hasTitle, isNew, values }) => (
    <Example hasTitle={hasTitle} isNew={isNew} values={values} />
  )
};
export default meta;

export const DescriptionOrLocation = {};
export const History = { args: { hasTitle: false } };
export const Editing = {
  args: {
    isNew: false,
    values: {
      title: 'Example contribution',
      body: 'An existing contribution ready to edit.',
      language: 'fra'
    }
  }
};
