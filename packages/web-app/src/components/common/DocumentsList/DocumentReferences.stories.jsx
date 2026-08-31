import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentReferences, {
  OrganizationDocumentReferences
} from './DocumentReferences';

const documents = [
  {
    id: 1,
    type: DocumentTypes.ARTICLE,
    title: 'Underground rivers of the Vercors',
    datePublication: '2024',
    authors: [{ id: 1, nickname: 'DUPONT Jean' }],
    parent: { id: 100, title: 'Speleology Review, no. 42' },
    pages: '12-18'
  },
  {
    id: 2,
    type: DocumentTypes.BOOK,
    title: 'Karst atlas',
    datePublication: '1998',
    authorsOrganization: [{ id: 2, name: 'Caving Club' }],
    editor: { id: 3, name: 'Cave Press' },
    identifier: '978-1-2345-6789-0',
    identifierType: 'isbn'
  },
  ...Array.from({ length: 9 }, (_, index) => ({
    id: index + 3,
    type: DocumentTypes.MAP,
    title: `Survey ${index + 1}`
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
