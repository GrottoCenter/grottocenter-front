import EntitySummary from './EntitySummary';

const meta = {
  title: 'Management/DeletedEntities/EntitySummary',
  component: EntitySummary
};
export default meta;

export const Organization = {
  args: {
    resource: 'organizations',
    entity: { type: 'SPELEOLOGY', language: 'fra' }
  }
};
export const Entrance = {
  args: {
    resource: 'entrances',
    entity: { city: 'Millau', region: 'Occitanie', country: 'FR' }
  }
};
export const EmptyCave = {
  args: {
    resource: 'caves',
    entity: { nbEntrances: 0, entrances: [], length: 0, depth: 0 }
  }
};
export const Network = {
  args: {
    resource: 'caves',
    entity: { nbEntrances: 3, length: 1200, depth: 150 }
  }
};
export const SensitiveMassif = {
  args: { resource: 'massifs', entity: { isSensitive: true } }
};
export const Guideline = {
  args: {
    resource: 'guidelines',
    entity: { countries: [{ name: 'France' }], language: 'fra' }
  }
};
export const Document = {
  args: {
    resource: 'documents',
    entity: { type: 'Article', mainLanguage: { id: 'eng', refName: 'English' } }
  }
};
