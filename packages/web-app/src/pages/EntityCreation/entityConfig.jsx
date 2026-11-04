import { defineMessages } from 'react-intl';

export { default as EntityIcon } from '@/components/common/EntityCreationIcon';

const descriptions = defineMessages({
  entrance: { id: 'Add a cave entrance with its location and characteristics' },
  document: {
    id: 'Add an image, topographic drawing, book, dataset, bibliography reference, etc.'
  },
  massif: { id: 'Add a massif with its geographical boundaries' },
  organization: { id: 'Add a caving club or scientific organization' },
  importObservations: {
    id: 'Import scientific observations from a CSV file produced by a data logger'
  }
});

export const ENTITIES = [
  {
    path: 'entrance',
    iconType: 'entrance',
    titleKey: 'Entrance',
    descriptionKey: descriptions.entrance
  },
  {
    path: 'document',
    iconType: 'bibliography',
    titleKey: 'Document',
    descriptionKey: descriptions.document
  },
  {
    path: 'massif',
    iconType: 'massif',
    titleKey: 'Massif',
    descriptionKey: descriptions.massif
  },
  {
    path: 'organization',
    iconType: 'organization',
    titleKey: 'Organization',
    descriptionKey: descriptions.organization
  },
  {
    path: '/ui/observations/import',
    iconType: 'scientific_observation',
    titleKey: 'Scientific observations',
    descriptionKey: descriptions.importObservations
  }
];
