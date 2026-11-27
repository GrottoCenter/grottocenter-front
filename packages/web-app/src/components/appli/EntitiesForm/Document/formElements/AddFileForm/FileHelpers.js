import { TEXT_LENGTH_LIMITS } from '@/utils/textLengthLimits';

// Those constants represent the state of the file.
// The actions performed depend on them.
export const IS_NEW = 'IS_NEW';
export const IS_MODIFIED = 'IS_MODIFIED';
export const IS_DELETED = 'IS_DELETED';
export const IS_INTACT = 'IS_INTACT';

export const AUTHORIZATION_FROM_AUTHOR = 'Author created this document';
export const LICENSE_IN_FILE = 'License in files';
export const DOCUMENT_AUTHORIZE_TO_PUBLISH =
  'Authorization present in Grottocenter';

/**
 * Validates and converts a File[] into the internal file entry format.
 * FileSelectorInput handles size and MIME acceptance. A per-type extension
 * restriction is also enforced here because unrelated binary formats can share
 * application/octet-stream. Other domain rules cover missing extensions,
 * oversized filenames and same-name collisions with a pending entry.
 */
export const validateAndBuildFileEntries = (
  newFiles,
  existingFiles,
  formatMessage,
  allowedExtensions = null
) => {
  const filesArray = Array.from(newFiles);
  const errors = [];
  const names = new Set(
    existingFiles
      .filter(file => file.state !== IS_DELETED)
      .map(file => file.fileName)
  );
  const entries = filesArray
    .filter(file => {
      if (file.name) {
        if (file.name.length > TEXT_LENGTH_LIMITS.FILE_NAME) {
          errors.push(
            formatMessage(
              { id: 'form.fileNameTooLong' },
              { file: file.name, limit: TEXT_LENGTH_LIMITS.FILE_NAME }
            )
          );
          return false;
        }
        const dotIndex = file.name.lastIndexOf('.');
        if (dotIndex <= 0) {
          errors.push(
            formatMessage(
              {
                id: 'error on file name',
                defaultMessage: 'The following file name is invalid : {file}.'
              },
              { file: file.name }
            )
          );
          return false;
        }
        const ext = file.name.slice(dotIndex + 1);
        if (
          allowedExtensions &&
          !allowedExtensions.includes(ext.toLowerCase())
        ) {
          errors.push(
            formatMessage(
              {
                id: 'error on file type',
                defaultMessage: 'The file type is not accepted: {file}.'
              },
              { file: file.name }
            )
          );
          return false;
        }
        if (names.has(file.name)) {
          errors.push(
            formatMessage(
              { id: 'documentForm.duplicateFile' },
              { file: file.name }
            )
          );
          return false;
        }
        names.add(file.name);
      }
      return true;
    })
    .map(file => ({ file, fileName: file.name ?? '', state: IS_NEW }));
  return { entries, errors };
};
