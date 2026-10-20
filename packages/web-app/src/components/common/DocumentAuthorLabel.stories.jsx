import DocumentAuthorLabel from './DocumentAuthorLabel';

const meta = {
  title: 'Common/DocumentAuthorLabel',
  component: DocumentAuthorLabel
};
export default meta;

export const Caver = {
  args: { author: { nickname: 'Marie Dupont', type: 'CAVER' } }
};
export const Author = {
  args: { author: { nickname: 'Jean Martin', type: 'AUTHOR' } }
};
export const Unknown = {
  args: { author: { nickname: 'Unclassified person' } }
};
export const Organization = {
  args: {
    author: { name: 'Caving club', type: 'SPELEOLOGY' },
    entityType: 'organizations'
  }
};
