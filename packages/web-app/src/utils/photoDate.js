import { normalizePublicationDate } from './documentDate';

export const readPhotoDate = async file => {
  if (!(file instanceof File) || !/\.(jpe?g|tiff?|png)$/i.test(file.name))
    return null;

  try {
    const { parse } = await import('exifr');
    const metadata = await parse(file, {
      pick: ['DateTimeOriginal'],
      // Keep the camera's calendar date; converting through Date/UTC can
      // otherwise move a photo taken near midnight to the previous day.
      reviveValues: false
    });
    const match = metadata?.DateTimeOriginal?.match(
      /^(\d{4}):(\d{2}):(\d{2})(?: |$)/
    );
    return match
      ? normalizePublicationDate(`${match[1]}-${match[2]}-${match[3]}`)
      : null;
  } catch (_error) {
    // Missing, malformed or unsupported metadata must never prevent an upload.
    return null;
  }
};
