import DocumentReferences from './DocumentReferences';

const documents = [
  {
    id: 1,
    title: 'Caves of the Chartreuse massif',
    type: 'Book',
    dateInscription: '2026-09-08T12:00:00.000Z'
  },
  {
    id: 2,
    title: 'Survey of the Trou du Glaz',
    type: 'Topography',
    dateInscription: '2026-09-07T12:00:00.000Z'
  }
];

const meta = {
  title: 'Common/Documents/DocumentReferences',
  component: DocumentReferences,
  args: {
    documents,
    totalCount: 42,
    searchFilter: { 'authorsOrganization.name': 'Wikicaves' }
  }
};
export default meta;

export const Preview = {};

export const CompleteList = {
  args: { totalCount: documents.length }
};

export const Empty = {
  args: {
    documents: [],
    totalCount: 0,
    emptyMessageComponent: 'No documents'
  }
};
