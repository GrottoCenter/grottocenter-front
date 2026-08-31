import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentReferences from './DocumentReferences';

const documents = [
  {
    id: 1,
    type: DocumentTypes.ARTICLE,
    title: 'Underground rivers of the Vercors',
    datePublication: '2024',
    authors: [{ id: 1, nickname: 'DUPONT, Jean' }],
    parent: { id: 100, title: 'Speleology Review' },
    issue: '42',
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

const meta = {
  title: 'Common/DocumentsList/DocumentReferences',
  component: DocumentReferences
};
export default meta;

export const Default = { args: { documents } };
