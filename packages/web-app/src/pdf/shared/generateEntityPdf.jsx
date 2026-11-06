import { Font, pdf } from '@react-pdf/renderer';
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import { registerPdfFonts } from './fonts';
import { EntityPdfDocument } from './EntityPdfDocument';
import { AnnexFrames } from './AnnexFrames';
import { PDF_MARGIN, ANNEX_TOP, ANNEX_BOTTOM } from './styles';
import { createPdfImagePreparer } from './images';
import {
  getPdfPageLinks,
  copyPdfPageLinks,
  retargetNativePageLinks
} from './annotations';
import { PDF_LIMITS, checkPdfLimit } from './limits';

const renderPdf = async element => {
  // The renderer appends Helvetica as a fallback without loading it from styles.
  await Promise.all(
    [400, 700].map(fontWeight =>
      Font.load({ fontFamily: 'Helvetica', fontWeight })
    )
  );
  return PDFDocument.load(await (await pdf(element).toBlob()).arrayBuffer());
};

const fitPage = source => {
  const [width, height] = source.size;
  const scale = Math.min(
    (width - PDF_MARGIN * 2) / source.width,
    (height - ANNEX_TOP - ANNEX_BOTTOM) / source.height
  );
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  return {
    scale,
    drawWidth,
    drawHeight,
    x: (width - drawWidth) / 2,
    y: ANNEX_BOTTOM + (height - ANNEX_TOP - ANNEX_BOTTOM - drawHeight) / 2
  };
};

const getFrameSize = (width, height) =>
  width > height ? [...PageSizes.A4].reverse() : PageSizes.A4;

export const generateEntityPdf = async (
  model,
  attachments,
  { format = 'a4', fontSources, inlineImages = [], onProgress = () => {} } = {}
) => {
  const { map: _map, ...textModel } = model;
  const fontFamily = registerPdfFonts(JSON.stringify(textModel), fontSources);
  const output = await PDFDocument.create();
  const pages = [];
  const prepareImage = createPdfImagePreparer();
  const preparedInlineImages = new Map();
  let totalBytes = 0;
  const buffers = new Set();
  for (const file of [...attachments, ...inlineImages]) {
    if (buffers.has(file.bytes)) continue;
    buffers.add(file.bytes);
    totalBytes += file.bytes.byteLength;
    try {
      checkPdfLimit(totalBytes, PDF_LIMITS.resourceBytes);
    } catch (error) {
      error.resource = file.fileName;
      throw error;
    }
  }
  // Decode serially and reuse prepared bytes for an image shown inline and in an annex.
  /* eslint-disable no-await-in-loop */
  for (const image of inlineImages) {
    onProgress(image.fileName);
    try {
      preparedInlineImages.set(image.key, await prepareImage(image));
    } catch (error) {
      error.resource = image.fileName;
      throw error;
    }
  }
  for (const attachment of attachments) {
    onProgress(attachment.fileName);
    try {
      if (attachment.isPdf) {
        const document = await PDFDocument.load(attachment.bytes);
        checkPdfLimit(pages.length + document.getPageCount(), PDF_LIMITS.pages);
        for (const [index, source] of document.getPages().entries()) {
          const crop = source.getCropBox();
          const rotation = ((source.getRotation().angle % 360) + 360) % 360;
          const isNative = format === 'original';
          const links = isNative ? [] : getPdfPageLinks(source);
          let embedded = null;
          if (!isNative && source.node.Contents()) {
            embedded = await output.embedPage(source, {
              left: crop.x,
              bottom: crop.y,
              right: crop.x + crop.width,
              top: crop.y + crop.height
            });
            // Force deferred stream decoding here so errors retain the source filename.
            await embedded.embed();
          }
          pages.push({
            attachment,
            document,
            index,
            embedded,
            links,
            crop,
            rotation,
            width: rotation % 180 ? crop.height : crop.width,
            height: rotation % 180 ? crop.width : crop.height,
            size: getFrameSize(
              rotation % 180 ? crop.height : crop.width,
              rotation % 180 ? crop.width : crop.height
            ),
            isNative
          });
        }
      } else {
        checkPdfLimit(pages.length + 1, PDF_LIMITS.pages);
        const prepared = await prepareImage(attachment);
        const image =
          prepared.format === 'jpeg'
            ? await output.embedJpg(prepared.bytes)
            : await output.embedPng(prepared.bytes);
        pages.push({
          attachment,
          image,
          width: image.width,
          height: image.height,
          size: getFrameSize(image.width, image.height),
          isNative: false
        });
      }
    } catch (error) {
      error.resource = attachment.fileName;
      throw error;
    }
  }
  const nativeAnnexes = model.references.flatMap(reference => {
    const files = reference.files.flatMap(file => {
      const indices = pages.flatMap((page, index) =>
        page.isNative && page.attachment.key === file.key ? [index + 1] : []
      );
      return indices.length
        ? [
            {
              ...file,
              firstPage: indices[0],
              lastPage: indices[indices.length - 1]
            }
          ]
        : [];
    });
    return files.length ? [{ ...reference, files }] : [];
  });
  onProgress(model.labels.Information);
  const sheet = await renderPdf(
    <EntityPdfDocument
      model={{
        ...model,
        nativeAnnexes,
        inlineDocuments: (model.inlineDocuments ?? []).map(document => ({
          ...document,
          files: document.files.map(file => ({
            ...file,
            image: preparedInlineImages.get(file.key)?.bytes,
            format: preparedInlineImages.get(file.key)?.format
          }))
        }))
      }}
      fontFamily={fontFamily}
      annexPageCount={pages.length}
    />
  );
  const sheetPages = await output.copyPages(sheet, sheet.getPageIndices());
  sheetPages.forEach(page => output.addPage(page));
  try {
    checkPdfLimit(sheetPages.length + pages.length, PDF_LIMITS.pages);
  } catch (error) {
    error.resource = model.title;
    throw error;
  }
  const framedPages = pages.flatMap((page, index) => {
    if (page.isNative) return [];
    const reference = model.references.find(document =>
      document.files?.some(file => file.key === page.attachment.key)
    );
    return [
      {
        key: `${page.attachment.key}:${index}`,
        title:
          reference?.title ||
          page.attachment.documentTitle ||
          page.attachment.fileName,
        source: reference?.source,
        authors: reference?.authors ?? '',
        license: reference?.license ?? '',
        size: page.size,
        number: sheetPages.length + index + 1
      }
    ];
  });
  let copiedFrames = [];
  if (framedPages.length) {
    onProgress(model.labels.Documents);
    const frames = await renderPdf(
      <AnnexFrames
        model={model}
        fontFamily={fontFamily}
        pages={framedPages}
        total={sheetPages.length + pages.length}
      />
    );
    copiedFrames = await output.copyPages(frames, frames.getPageIndices());
  }
  let frameIndex = 0;
  const nativeCopies = new Map();
  for (const source of pages) {
    if (source.isNative) {
      if (!nativeCopies.has(source.document)) {
        const copied = await output.copyPages(
          source.document,
          source.document.getPageIndices()
        );
        retargetNativePageLinks(source.document, copied);
        nativeCopies.set(source.document, copied);
      }
      output.addPage(nativeCopies.get(source.document)[source.index]);
      continue;
    }
    const page = output.addPage(copiedFrames[frameIndex++]);
    const { scale, drawWidth, drawHeight, x, y } = fitPage(source);
    if (source.image)
      page.drawImage(source.image, {
        x,
        y,
        width: drawWidth,
        height: drawHeight
      });
    else {
      if (source.embedded) {
        const positions = {
          0: [x, y],
          90: [x, y + drawHeight],
          180: [x + drawWidth, y + drawHeight],
          270: [x + drawWidth, y]
        };
        const [drawX, drawY] = positions[source.rotation];
        page.drawPage(source.embedded, {
          x: drawX,
          y: drawY,
          xScale: scale,
          yScale: scale,
          rotate: degrees(-source.rotation)
        });
      }
      copyPdfPageLinks(source.links, page, {
        crop: source.crop,
        rotation: source.rotation,
        scale,
        x,
        y
      });
    }
  }
  /* eslint-enable no-await-in-loop */
  output.setTitle(model.title);
  output.setAuthor('Grottocenter');
  output.setSubject(model.source);
  output.setCreator('Grottocenter');
  output.setLanguage(model.locale);
  return output.save();
};
