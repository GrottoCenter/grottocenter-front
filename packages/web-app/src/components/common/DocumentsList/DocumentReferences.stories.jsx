import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentReferences from './DocumentReferences';
import OrganizationDocumentReferences from './OrganizationDocumentReferences';

const documents = [
  {
    id: 1,
    type: DocumentTypes.ARTICLE,
    title: 'Underground rivers of the Vercors',
    datePublication: '2024',
    authors: [{ id: 1, nickname: 'DUPONT Jean' }],
    authorsOrganization: [],
    parent: {
      id: 100,
      type: DocumentTypes.ISSUE,
      issue: 'no. 42',
      parent: {
        id: 101,
        type: DocumentTypes.COLLECTION,
        title: 'Speleology Review'
      }
    },
    pages: '12-18'
  },
  {
    id: 2,
    type: DocumentTypes.BOOK,
    title: 'Karst atlas',
    datePublication: '1998',
    authors: [],
    authorsOrganization: [{ id: 2, name: 'Caving Club' }],
    editor: { id: 3, name: 'Cave Press' },
    identifier: '978-1-2345-6789-0',
    identifierType: 'isbn'
  },
  ...Array.from({ length: 9 }, (_, index) => ({
    id: index + 3,
    type: DocumentTypes.ARTICLE,
    title: `Caving article ${index + 1}`,
    datePublication: String(2015 + index),
    authors: [],
    authorsOrganization: []
  }))
];

const organizationDocuments = [
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
  title: 'Common/DocumentsList/DocumentReferences',
  component: DocumentReferences
};
export default meta;

export const Default = { args: { documents } };

export const OrganizationPreview = {
  render: ({ documents: previewDocuments, totalCount, searchFilter }) => (
    <OrganizationDocumentReferences
      documents={previewDocuments}
      totalCount={totalCount}
      searchFilter={searchFilter}
    />
  ),
  args: {
    documents: organizationDocuments,
    totalCount: 42,
    searchFilter: { 'authorsOrganization.name': 'Wikicaves' }
  }
};

export const OrganizationCompleteList = {
  ...OrganizationPreview,
  args: {
    ...OrganizationPreview.args,
    totalCount: organizationDocuments.length
  }
};

export const OrganizationEmpty = {
  ...OrganizationPreview,
  args: {
    ...OrganizationPreview.args,
    documents: [],
    totalCount: 0
  }
};
