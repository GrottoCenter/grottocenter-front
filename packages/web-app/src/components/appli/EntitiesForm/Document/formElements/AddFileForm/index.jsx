import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { MAX_SIZE_OF_UPLOADED_FILES } from '@/conf/config';
import { canSetPanorama } from '@/utils/documentPanorama';
import { DocumentFileErrorPropTypes } from '@/types/document.type';
import { useFileFormats } from '@/hooks';
import ErrorsList from './ErrorsList';
import {
  IS_DELETED,
  IS_NEW,
  IS_MODIFIED,
  validateAndBuildFileEntries
} from './FileHelpers';
import FileSelectorInput, {
  REJECTION_REASONS
} from '../../../../../common/FileSelectorInput';
import PdfPageOffsetEditor from '../PdfPageOffsetEditor';
import DocumentPdfAnalysis from '../DocumentPdfAnalysis';
import PanoramaDisplayEditor from '../PanoramaDisplayEditor';

const AddFileForm = ({
  files,
  setFiles,
  acceptConfig = null,
  allowFileAdd = true,
  allowAiAnalysis = false,
  disabled = false,
  fileError
}) => {
  const { formatMessage } = useIntl();
  const [errors, setErrors] = useState([]);
  const {
    mimeTypes,
    extensions: backendExtensions,
    isLoading
  } = useFileFormats();
  const extensions =
    acceptConfig?.extensions ??
    backendExtensions.filter(e => e !== null).map(e => e.trim());
  // Build the accept attribute from both MIME types and file extensions. Some
  // supported formats have MIME types the browser cannot resolve to a picker
  // filter (e.g. application/gpx+xml, or the application/octet-stream Therion
  // formats th/th2/thconfig/lox/xvi…), so listing the extensions explicitly is
  // what actually makes those files selectable.
  const dottedExtensions = extensions.map(e => `.${e}`);
  const accept = [
    acceptConfig?.mime ?? mimeTypes.toString(),
    ...dottedExtensions
  ]
    .filter(Boolean)
    .join(',');
  const visibleFiles = files.filter(file => file.state !== IS_DELETED);

  // react-dropzone dispatches accepted and rejected files through two separate
  // callbacks within a single onDrop event. React 18 batches the two setErrors
  // calls, so a naive setErrors(newValue) in each would let the later call
  // silently drop the earlier one — losing domain errors (duplicate names,
  // missing extensions) whenever a mixed drop also has rejections. The ref
  // below records that updateFiles ran in the current event so handleRejections
  // knows whether to reset (rejections-only drop) or append (mixed drop). A
  // microtask clears it after the synchronous batch completes.
  const acceptedInThisDropRef = useRef(false);

  const updateFiles = newFiles => {
    acceptedInThisDropRef.current = true;
    queueMicrotask(() => {
      acceptedInThisDropRef.current = false;
    });
    const { entries, errors: errorsList } = validateAndBuildFileEntries(
      newFiles,
      files,
      formatMessage,
      acceptConfig?.extensions
    );
    setErrors(errorsList);
    setFiles([...files, ...entries]);
  };

  const handleRejections = rejections => {
    const messages = rejections.map(({ fileName, reasons }) => {
      if (reasons.includes(REJECTION_REASONS.TOO_LARGE)) {
        return formatMessage(
          {
            id: 'error on file size',
            defaultMessage:
              'The following file is too big: {file}. Max accepted size: {maxSize}'
          },
          {
            file: fileName,
            maxSize: `${MAX_SIZE_OF_UPLOADED_FILES / 1000000} Mo`
          }
        );
      }
      if (reasons.includes(REJECTION_REASONS.TYPE_NOT_ACCEPTED)) {
        return formatMessage(
          {
            id: 'error on file type',
            defaultMessage: 'The file type is not accepted: {file}.'
          },
          { file: fileName }
        );
      }
      return formatMessage(
        {
          id: 'This file was rejected: {file}.',
          defaultMessage: 'This file was rejected: {file}.'
        },
        { file: fileName }
      );
    });
    // Capture before React evaluates the updater, possibly after the microtask.
    const shouldAppend = acceptedInThisDropRef.current;
    setErrors(prev => (shouldAppend ? [...prev, ...messages] : messages));
  };

  const removeFile = (_fileName, target) => {
    if (target.state === IS_NEW) {
      setFiles(files.filter(file => file !== target));
    } else {
      setFiles(
        files.map(file =>
          file === target ? { ...file, state: IS_DELETED } : file
        )
      );
    }
  };

  const renderFileDetails = (file, url) => {
    if (canSetPanorama(file.fileName)) {
      return (
        <PanoramaDisplayEditor
          isNew={file.state === IS_NEW}
          value={
            file.state === IS_NEW ? file.isPanorama : (file.isPanorama ?? false)
          }
          error={fileError?.file === file ? fileError.code : undefined}
          onChange={isPanorama =>
            setFiles(
              files.map(item =>
                item === file
                  ? {
                      ...item,
                      isPanorama,
                      state: item.state === IS_NEW ? IS_NEW : IS_MODIFIED
                    }
                  : item
              )
            )
          }
        />
      );
    }
    if (!/\.pdf$/i.test(file.fileName)) return null;
    return (
      <PdfPageOffsetEditor
        src={url}
        value={file.pdfPageOffset}
        onChange={offset =>
          setFiles(
            files.map(item =>
              item === file
                ? {
                    ...item,
                    pdfPageOffset: offset,
                    state: item.state === IS_NEW ? IS_NEW : IS_MODIFIED
                  }
                : item
            )
          )
        }
      />
    );
  };

  const renderFileActions = file => {
    if (
      !allowAiAnalysis ||
      (!(file.file instanceof File) && !file.completePath) ||
      !/\.pdf$/i.test(file.fileName)
    )
      return null;
    return (
      <DocumentPdfAnalysis
        file={file.file instanceof File ? file.file : file}
        disabled={disabled}
      />
    );
  };

  return (
    <>
      <FileSelectorInput
        files={visibleFiles}
        onFilesAdd={updateFiles}
        onFileRemove={removeFile}
        onFileRejections={handleRejections}
        accept={accept}
        extensions={extensions}
        maxSize={MAX_SIZE_OF_UPLOADED_FILES}
        allowFileAdd={allowFileAdd}
        disabled={(allowFileAdd && isLoading) || disabled}
        renderFileDetails={allowFileAdd ? renderFileDetails : undefined}
        renderFileActions={renderFileActions}
      />
      <ErrorsList errors={errors} />
    </>
  );
};

AddFileForm.propTypes = {
  allowAiAnalysis: PropTypes.bool,
  allowFileAdd: PropTypes.bool,
  disabled: PropTypes.bool,
  fileError: DocumentFileErrorPropTypes,
  acceptConfig: PropTypes.shape({
    extensions: PropTypes.arrayOf(PropTypes.string).isRequired,
    mime: PropTypes.string.isRequired
  }),
  files: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  setFiles: PropTypes.func.isRequired
};

export default AddFileForm;
