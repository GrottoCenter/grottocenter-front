import { isNil } from 'ramda';
import { MAX_SIZE_OF_UPLOADED_FILES } from '../../../../../../conf/config';

// Those constants represent the state of the file.
// The actions performed depend on them.
export const IS_NEW = 'IS_NEW';
export const IS_MODIFIED = 'IS_MODIFIED';
export const IS_DELETED = 'IS_DELETED';
export const IS_INTACT = 'IS_INTACT';

export const AUTHORIZATION_FROM_AUTHOR = 'Author created this document';
export const LICENSE_IN_FILE = 'License in files';
export const DOCUMENT_AUTHORIZE_TO_PUBLISH =
  'Authorization present in GrottoCenter';

/**
 * Validates and converts a FileList/array of File objects into the internal file entry format.
 * Returns { entries, errors } where entries are ready to append and errors are i18n strings.
 */
export const validateAndBuildFileEntries = (newFiles, existingFiles, formatMessage) => {
  const filesArray = Array.from(newFiles);
  const errors = [];
  const entries = filesArray
    .filter(file => {
      if (file.size && file.size > MAX_SIZE_OF_UPLOADED_FILES) {
        errors.push(
          formatMessage(
            {
              id: 'error on file size',
              defaultMessage:
                'The following file is too big: {file}. Max accepted size: {maxSize}'
            },
            { file: file.name, maxSize: `${MAX_SIZE_OF_UPLOADED_FILES / 1000000} Mo` }
          )
        );
        return false;
      }
      if (file.name) {
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
        const name = file.name.slice(0, dotIndex);
        const ext = file.name.slice(dotIndex + 1);
        return isNil(
          existingFiles.find(
            existing =>
              existing.name === name &&
              existing.extension === ext &&
              existing.state === IS_NEW
          )
        );
      }
      return true;
    })
    .map(file => ({ file, fileName: file.name ?? '', state: IS_NEW }));
  return { entries, errors };
};
