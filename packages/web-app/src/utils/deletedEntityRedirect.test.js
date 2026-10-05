import {
  getDeletedEntityRedirectUrl,
  getPostDeletionUrl
} from './deletedEntityRedirect';

const entityType = { url: '/ui/entrances/' };

describe('deleted entity navigation', () => {
  it('uses the newly selected replacement when an older redirect exists', () => {
    expect(getPostDeletionUrl(entityType, 42, 43)).toBe('/ui/entrances/42');
  });

  it('uses the stored redirect when permanently deleting a deleted entity', () => {
    expect(getPostDeletionUrl(entityType, null, 43)).toBe('/ui/entrances/43');
    expect(getDeletedEntityRedirectUrl(entityType, 43)).toBe(
      '/ui/entrances/43'
    );
  });

  it('falls back to home when there is no replacement', () => {
    expect(getPostDeletionUrl(entityType, null, null)).toBe('/');
    expect(getDeletedEntityRedirectUrl(entityType, null)).toBeNull();
  });
});
