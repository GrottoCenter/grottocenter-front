import { DocumentTypes } from '@/utils/documentTypeHelpers';
import DocumentReferenceText from './DocumentReferenceText';

const meta = {
  title: 'Common/DocumentReferenceText',
  component: DocumentReferenceText
};
export default meta;

export const Article = {
  args: {
    document: {
      id: 1,
      type: DocumentTypes.ARTICLE,
      title: 'Underground rivers',
      datePublication: '2024',
      authors: [
        {
          id: 1,
          nickname: 'jdupont',
          name: 'Jean',
          surname: 'Dupont'
        }
      ],
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
      }
    }
  }
};

export const Book = {
  args: {
    document: {
      id: 2,
      type: DocumentTypes.BOOK,
      title: 'Karst atlas',
      datePublication: '1998',
      authors: [],
      authorsOrganization: [{ id: 2, name: 'Caving Club' }],
      editor: { id: 3, name: 'Cave Press' }
    }
  }
};

export const PeriodicalIssue = {
  args: {
    document: {
      id: 3,
      type: DocumentTypes.ISSUE,
      title: "Le P'tit Usnia n° 337",
      datePublication: '2026-09',
      authors: [],
      authorsOrganization: [
        {
          id: 21,
          name: 'Union spéléologique de l’agglomération nancéienne (USAN)'
        }
      ],
      editor: {
        id: 21,
        name: 'Union spéléologique de l’agglomération nancéienne (USAN)'
      },
      identifier: 'https://example.org/le-ptit-usnia-337.pdf',
      identifierType: 'url'
    }
  }
};

export const PeriodicalCollection = {
  args: {
    document: {
      id: 4,
      type: DocumentTypes.COLLECTION,
      title: "Le P'tit Usania",
      authors: [],
      authorsOrganization: [],
      editor: {
        id: 21,
        name: 'Union spéléologique de l’agglomération nancéienne (USAN)'
      },
      identifier: '1292-5950',
      identifierType: 'issn'
    }
  }
};
