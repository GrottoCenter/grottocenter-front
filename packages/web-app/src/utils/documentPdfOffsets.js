import { getFileExtension } from '@/components/common/DocumentsList/utils/imageUtils';
import { findDocumentPdfUrl } from './pdfUrl';
import { DocumentTypes } from './documentTypeHelpers';

export const PDF_OFFSET_DOCUMENT_TYPES = [
  DocumentTypes.ISSUE,
  DocumentTypes.BOOK
];

export const getPdfsWithoutOffset = document => {
  if (document.isDeleted) return [];
  const url = findDocumentPdfUrl(document);
  return [
    ...(url && document.identifierPdfPageOffset == null
      ? [{ key: 'identifier', url, name: url }]
      : []),
    ...(document.files ?? [])
      .filter(
        file =>
          getFileExtension(file.fileName) === '.pdf' &&
          file.pdfPageOffset == null
      )
      .map(file => ({
        key: `file-${file.id}`,
        url: file.completePath,
        name: file.fileName
      }))
  ];
};
