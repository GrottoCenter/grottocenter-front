import { AVATAR_MAX_BYTES, getAvatarFileError } from './avatarImage';

describe('avatar file validation', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])(
    'accepts %s',
    type => {
      expect(
        getAvatarFileError(new File(['image'], 'photo', { type }))
      ).toBeNull();
    }
  );
  it('accepts the exact maximum size and rejects oversized files', () => {
    expect(
      getAvatarFileError({ type: 'image/png', size: AVATAR_MAX_BYTES })
    ).toBeNull();
    expect(
      getAvatarFileError({ type: 'image/png', size: AVATAR_MAX_BYTES + 1 })
    ).toBe('avatar.tooLarge');
  });
  it('rejects SVG, missing types and empty images', () => {
    expect(
      getAvatarFileError(
        new File(['<svg />'], 'logo.svg', { type: 'image/svg+xml' })
      )
    ).toBe('avatar.invalidFormat');
    expect(getAvatarFileError(new File(['image'], 'photo'))).toBe(
      'avatar.invalidFormat'
    );
    expect(
      getAvatarFileError(new File([], 'photo.png', { type: 'image/png' }))
    ).toBe('avatar.invalidImage');
  });
});
