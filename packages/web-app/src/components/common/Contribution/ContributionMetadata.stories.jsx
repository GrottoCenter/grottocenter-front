import ContributionMetadata from './ContributionMetadata';

const meta = {
  title: 'Common/ContributionMetadata',
  component: ContributionMetadata
};
export default meta;

export const CreatedAndUpdated = {
  args: {
    createdBy: { id: 1, nickname: 'Frédéric Urien' },
    createdAt: '2012-11-05T09:30:00.000Z',
    updatedBy: { id: 2, nickname: 'Biboc' },
    updatedAt: '2024-10-08T09:30:00.000Z',
    language: 'fra'
  }
};

export const Posted = {
  args: {
    createdBy: { id: 1, nickname: 'Paul Aubertin' },
    createdAt: '2026-06-04T09:30:00.000Z',
    language: 'fra',
    creationVerb: 'Posted'
  }
};
