import {
  IS_MODIFIED,
  IS_NEW
} from '@/components/appli/EntitiesForm/Document/formElements/AddFileForm/FileHelpers';

// This only determines whether to offer the setting. The API checks the image
// itself; neither its filename nor its dimensions establish panorama status.
export const canSetPanorama = fileName => /\.(jpe?g|png|webp)$/i.test(fileName);

export const getDocumentPanoramaError = (error, files = []) => {
  const { code, metadata } = error?.body ?? {};
  if (
    error?.status !== 400 ||
    !['E_INVALID_PANORAMA_FLAG', 'E_INCOMPATIBLE_PANORAMA'].includes(code)
  )
    return null;

  const match = metadata?.field?.match(
    /^(newFilesMetadata|modifiedFiles)\[(\d+)\]\[isPanorama\]$/
  );
  const state = match?.[1] === 'newFilesMetadata' ? IS_NEW : IS_MODIFIED;
  const file = match
    ? files.filter(item => item.state === state)[Number(match[2])]
    : undefined;
  // Keep the submitted file identity: reordering/removing other files must not
  // move an error to a different attachment. Changing this file clears it.
  return { code, file };
};
