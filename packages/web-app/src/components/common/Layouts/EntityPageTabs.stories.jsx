import EntityPageTabs from './EntityPageTabs';

export default {
  title: 'Layouts/EntityPageTabs',
  component: EntityPageTabs,
  args: {
    tabs: [{ id: 'information' }, { id: 'documents', count: 3 }],
    panels: {
      information: <p>Entity information</p>,
      documents: <p>Associated documents</p>
    },
    errorMessageId: 'Error, the data you are looking for is not available.',
    onRetry: () => undefined
  }
};

export const Default = {};
export const Loading = { args: { isLoading: true, panels: {} } };
export const NotFound = { args: { error: { status: 404 }, panels: {} } };
export const RefreshError = { args: { error: { status: 500 } } };
export const Entrance = {
  args: {
    tabs: [
      { id: 'information' },
      { id: 'documents', count: 3 },
      { id: 'science' },
      { id: 'comments', count: 2 }
    ]
  }
};
