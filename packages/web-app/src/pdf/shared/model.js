import { sortDocuments, DOCUMENT_SORT_ORDERS } from '@/utils/documentSort';
import { formatDocumentReference } from '@/utils/documentReference';
import { findDocumentPdfUrl, isPdfUrl } from '@/utils/pdfUrl';
import { getMediaThumbnailSources, isGalleryFile } from '@/utils/mediaUtils';
import {
  decodeFileName,
  isImageFile,
  isModelPreview
} from '@/components/common/DocumentsList/utils/imageUtils';

export const active = items => (items ?? []).filter(item => !item.isDeleted);
export const makePdfLinksBlock = (key, label, items, intl) => ({
  key,
  title: intl.formatMessage({ id: label }),
  type: 'links',
  items: active(items).map(item => ({
    id: item.id,
    title: item.title,
    source: item.source,
    details: item.details ?? []
  }))
});
export const getWgs84Coordinates = ({ latitude, longitude }) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180
    ? { latitude, longitude }
    : null;
const personName = person =>
  person?.nickname ?? [person?.name, person?.surname].filter(Boolean).join(' ');

export const getPdfAttachments = documents => {
  const seen = new Set();
  return sortDocuments(active(documents), DOCUMENT_SORT_ORDERS.TYPE).flatMap(
    document => {
      const files = [...(document.files ?? [])];
      const externalPdf = findDocumentPdfUrl(document);
      if (externalPdf && !files.some(file => file.completePath === externalPdf))
        files.push({
          completePath: externalPdf,
          fileName: new URL(externalPdf).pathname.split('/').pop()
        });
      return files.flatMap(file => {
        const url = file.completePath;
        if (!url || seen.has(url)) return [];
        let parsed;
        try {
          parsed = new URL(url);
        } catch {
          return [];
        }
        if (!['https:', 'http:'].includes(parsed.protocol)) return [];
        const isPdf = isPdfUrl(url) || /\.pdf$/i.test(file.fileName ?? '');
        if (!isPdf && !isImageFile(file.fileName ?? parsed.pathname)) return [];
        seen.add(url);
        return [
          {
            key: `${document.id}:${file.id ?? url}`,
            documentId: document.id,
            documentTitle: document.title ?? '',
            fileName: decodeFileName(
              file.fileName ?? parsed.pathname.split('/').pop()
            ),
            url,
            isPdf
          }
        ];
      });
    }
  );
};

const documentMetadata = (document, intl) => {
  const citation = formatDocumentReference(
    {
      ...document,
      authors: document.authors ?? [],
      authorsOrganization: document.authorsOrganization ?? []
    },
    {
      availableAt: intl.formatMessage({ id: 'Available at:' }),
      online: intl.formatMessage({ id: 'online' })
    }
  );
  const authors = [
    ...(document.authors ?? []).map(personName),
    ...(document.authorsOrganization ?? []).map(author => author.name)
  ]
    .filter(Boolean)
    .join(', ');
  return {
    title: document.title ?? '',
    type: document.type ?? '',
    bibliography: citation,
    authors,
    credit: [authors, document.license, document.datePublication]
      .filter(Boolean)
      .join(' · '),
    license: document.license ?? '',
    source: `https://grottocenter.org/ui/documents/${document.id}`
  };
};

export const getPdfInlineDocuments = (documents, intl) =>
  sortDocuments(active(documents), DOCUMENT_SORT_ORDERS.TYPE).flatMap(
    document => {
      const files = (document.files ?? [])
        .filter(file => isGalleryFile(file.fileName) || isModelPreview(file))
        .flatMap(file => {
          const { src } = getMediaThumbnailSources(file);
          try {
            if (!['http:', 'https:'].includes(new URL(src).protocol)) return [];
          } catch {
            return [];
          }
          return [
            {
              key: `${document.id}:inline:${file.id ?? src}`,
              fileName: decodeFileName(file.fileName),
              url: src
            }
          ];
        });
      return files.length
        ? [{ ...documentMetadata(document, intl), id: document.id, files }]
        : [];
    }
  );

export const contribution = (item, intl) => {
  const date = value => {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : intl.formatDate(parsed);
  };
  return {
    id: item.id,
    title: item.title ?? '',
    body: item.body ?? '',
    metadata: [
      item.author &&
        `${personName(item.author)} (${date(item.dateInscription)})`,
      item.reviewer &&
        `${intl.formatMessage({ id: 'Updated' })}: ${personName(item.reviewer)} (${date(item.dateReviewed)})`,
      typeof item.language === 'string' && item.language.toUpperCase()
    ]
      .filter(Boolean)
      .join(' · '),
    obstacles: (item.obstacles ?? []).map((row, position) => ({
      key: `${item.id}:${position}`,
      obstacle: String(row.obstacle ?? ''),
      rope: String(row.rope ?? ''),
      anchor: String(row.anchor ?? ''),
      observation: String(row.observation ?? '')
    }))
  };
};

export const buildDocumentIndex = ({
  documents,
  attachments,
  includeReferences,
  intl
}) => {
  const byId = new Map(
    active(documents).map(document => [document.id, document])
  );
  if (attachments.some(file => !byId.has(file.documentId)))
    throw new Error('pdf.exportError');
  const selectedIds = new Set(attachments.map(file => file.documentId));
  const references = sortDocuments(
    [...byId.values()],
    DOCUMENT_SORT_ORDERS.TYPE
  )
    .filter(document => includeReferences || selectedIds.has(document.id))
    .map(document => {
      const metadata = documentMetadata(document, intl);
      return {
        ...metadata,
        bibliography: includeReferences ? metadata.bibliography : null,
        id: document.id,
        files: attachments.filter(file => file.documentId === document.id)
      };
    });
  return { references };
};

export const getPdfLabels = intl =>
  Object.fromEntries(
    [
      'Information',
      'Documents',
      'Bibliographic references',
      'Map',
      'Text',
      'Data',
      'Source',
      'Date',
      'Obstacle',
      'Rope',
      'Anchor',
      'Observations',
      'Notation legends',
      'Pages',
      'pdf.appendices'
    ].map(id => [id, intl.formatMessage({ id })])
  );

export const getGuidelines = entity => {
  const items = Array.isArray(entity.guidelines)
    ? entity.guidelines
    : Object.values(entity.guidelines ?? {}).flat();
  return [...new Map(active(items).map(item => [item.id, item])).values()];
};

export const makePdfBlock = (key, label, items, intl) => ({
  key,
  type: 'contributions',
  title: intl.formatMessage({ id: label }),
  items: active(items).map(item => contribution(item, intl))
});

export const makeEntityPdfModel = ({
  entity,
  entityType,
  route,
  sections,
  documents,
  attachments,
  intl,
  generatedAt = new Date(),
  properties,
  blocks,
  coordinates,
  warning = '',
  propertiesTitle = 'Information',
  legends = ''
}) => ({
  entityType,
  propertiesTitle: intl.formatMessage({ id: propertiesTitle }),
  locale: intl.locale,
  title:
    entity.name ??
    intl.formatMessage({
      id: {
        entrance: 'Entrance',
        network: 'Network',
        massif: 'Massif',
        country: 'Country',
        region: 'Region'
      }[entityType]
    }),
  source: `https://grottocenter.org/ui/${route}/${entity.id}`,
  generatedAt: intl.formatDate(generatedAt),
  metadata: contribution(entity, intl).metadata,
  warning,
  properties: sections.properties ? properties : [],
  coordinates: sections.map ? coordinates : null,
  blocks,
  ...buildDocumentIndex({
    documents,
    attachments,
    includeReferences: sections.documents,
    intl
  }),
  inlineDocuments: sections.documents
    ? getPdfInlineDocuments(documents, intl)
    : [],
  labels: getPdfLabels(intl),
  legends
});
