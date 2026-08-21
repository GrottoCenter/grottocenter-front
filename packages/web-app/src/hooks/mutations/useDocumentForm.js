import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  postDocumentUrl,
  putDocumentUrl,
  putDocumentyWithNewEntitiesUrl
} from '../../conf/apiRoutes';
import { apiPostForm, apiPutForm, apiPut } from '../../api/client';
import { documentKeys } from '../../api/queryKeys';
import { buildFormData } from '../../actions/Document/utils';
import { filterDocumentPayload } from '../../utils/documentTypeHelpers';
import {
  IS_DELETED,
  IS_MODIFIED,
  IS_NEW
} from '../../components/appli/EntitiesForm/Document/formElements/AddFileForm/FileHelpers';

// Map an HTTP error to the same message strings the legacy reducer produced,
// so DocumentSubmission/DocumentEdit can render them via formatMessage
// unchanged. The messages are translation keys, not user-facing text.
const buildDocErrorMessages = (verb, error) => {
  const status = error?.status;
  if (status === 400) {
    const detail = error?.body?.message ?? '';
    return [`Bad request: ${detail}`];
  }
  if (status === 403) return [`You are not authorized to ${verb} a document.`];
  if (status === 404) {
    return [
      `Server-side ${verb === 'create' ? 'creation' : 'update'} of the document is not available.`
    ];
  }
  if (status === 500) {
    return [
      'A server error occurred, please try again later or contact Wikicaves for more information.'
    ];
  }
  return [];
};

const buildDocumentFormData = docAttributes => {
  const filtered = filterDocumentPayload(docAttributes);
  const { files = [], selectOptionAuthorizationDocument, ...rest } = filtered;
  const attributes = { ...rest, option: selectOptionAuthorizationDocument };
  const formData = new FormData();
  buildFormData(formData, attributes);
  return { formData, files };
};

// Document creation: FormData multipart POST (files upload alongside the
// metadata). Success payload carries the created document — DocumentSubmission
// links it to an entrance when the form was opened from an entrance page.
export const useCreateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async docAttributes => {
      const { formData, files } = buildDocumentFormData(docAttributes);
      // Files must share the same "files" key so the parser groups them
      // together server-side.
      files.forEach(file => {
        formData.append('files', file.file, file.fileName);
      });
      try {
        const body = await apiPostForm(postDocumentUrl, formData);
        return body?.document;
      } catch (err) {
        err.errorMessages = buildDocErrorMessages('create', err);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    }
  });
};

// Document update: same FormData contract, plus tri-state file handling —
// existing files are re-declared under state-specific parent keys so the API
// can distinguish new, modified and deleted files in a single request.
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async docAttributes => {
      const { formData, files } = buildDocumentFormData(docAttributes);
      let indexDeleted = 0;
      let indexModified = 0;
      for (const file of files) {
        const { file: fileObjectJS, state, ...baseFile } = file;
        switch (state) {
          case IS_NEW:
            formData.append('files', fileObjectJS, baseFile.fileName);
            break;
          case IS_MODIFIED:
            buildFormData(
              formData,
              baseFile,
              `modifiedFiles[${indexModified}]`
            );
            indexModified += 1;
            break;
          case IS_DELETED:
            buildFormData(formData, baseFile, `deletedFiles[${indexDeleted}]`);
            indexDeleted += 1;
            break;
          default:
        }
      }
      try {
        return await apiPutForm(putDocumentUrl(docAttributes.id), formData);
      } catch (err) {
        err.errorMessages = buildDocErrorMessages('update', err);
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(variables.id)
      });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    }
  });
};

// Duplicate-resolution variant: JSON body carrying the doc plus the freshly
// created child entities. Endpoint decides which records to link vs update,
// so this cannot piggy-back on the FormData path above.
export const useUpdateDocumentWithNewEntities = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ document, newAuthors, newDescriptions }) => {
      try {
        return await apiPut(putDocumentyWithNewEntitiesUrl(document.id), {
          document: filterDocumentPayload(document),
          newAuthors,
          newDescriptions
        });
      } catch (err) {
        err.errorMessages = buildDocErrorMessages('update', err);
        throw err;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(variables.document.id)
      });
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
    }
  });
};
