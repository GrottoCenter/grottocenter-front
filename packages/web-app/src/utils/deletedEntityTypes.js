import { ADVANCED_SEARCH_TYPES } from '@/conf/config';

export const DELETED_ENTITIES = {
  entrance: {
    iconType: 'entrance',
    str: 'Entrance',
    url: '/ui/entrances/',
    searchType: ADVANCED_SEARCH_TYPES.ENTRANCES
  },
  massif: {
    iconType: 'massif',
    str: 'Massif',
    url: '/ui/massifs/',
    searchType: ADVANCED_SEARCH_TYPES.MASSIFS
  },
  organization: {
    iconType: 'organization',
    str: 'Organization',
    url: '/ui/organizations/',
    searchType: ADVANCED_SEARCH_TYPES.ORGANIZATIONS
  },
  document: {
    iconType: 'bibliography',
    str: 'Document',
    url: '/ui/documents/',
    searchType: ADVANCED_SEARCH_TYPES.DOCUMENTS
  },
  guideline: {
    iconType: 'guidelines',
    str: 'Guideline',
    url: '/ui/guidelines/'
  },
  network: {
    iconType: 'network',
    str: 'Network',
    url: '/ui/caves/',
    searchType: ADVANCED_SEARCH_TYPES.CAVES
  },
  person: {
    iconType: 'person',
    str: 'Person',
    url: '/ui/persons/',
    searchType: 'persons'
  },
  comment: { str: 'Comment' },
  description: { str: 'Description' },
  history: { str: 'History' },
  location: { str: 'Location' },
  rigging: { str: 'Rigging' }
};
