import { Font, pdf } from '@react-pdf/renderer';
import { PDFDocument, PageSizes, degrees } from 'pdf-lib';
import { registerPdfFonts } from './fonts';
import { parsePdfPages } from './pages';
import {
  EntityPdfDocument,
  AnnexFrames,
  PDF_MARGIN,
  ANNEX_TOP,
  ANNEX_BOTTOM
} from './EntityPdfDocument';

const renderPdf = async element => {
  // The renderer appends Helvetica as a fallback without loading it from styles.
  await Promise.all(
    [400, 700].map(fontWeight =>
      Font.load({ fontFamily: 'Helvetica', fontWeight })
    )
  );
  const blob = await pdf(element).toBlob();
  return PDFDocument.load(await blob.arrayBuffer());
};

const imageBytes = async bytes => {
  if (typeof OffscreenCanvas === 'undefined') return bytes;
  const image = await createImageBitmap(new Blob([bytes]));
  try {
    const canvas = new OffscreenCanvas(image.width, image.height);
    canvas.getContext('2d').drawImage(image, 0, 0);
    return new Uint8Array(
      await (await canvas.convertToBlob({ type: 'image/png' })).arrayBuffer()
    );
  } finally {
    image.close();
  }
};

export const generateEntityPdf = async (
  model,
  attachments,
  { format = 'a4', fontSources, inlineImages = [], onProgress = () => {} } = {}
) => {
  const { map: _map, ...textModel } = model;
  const fontFamily = registerPdfFonts(JSON.stringify(textModel), fontSources);
  const output = await PDFDocument.create();
  const pages = [];
  const preparedInlineImages = new Map();
  // Serialize decoding and embedding to avoid holding every decoded original in memory.
  /* eslint-disable no-await-in-loop */
  for (const image of inlineImages) {
    onProgress(image.fileName);
    try {
      preparedInlineImages.set(image.key, await imageBytes(image.bytes));
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
        const selected = parsePdfPages(
          attachment.pages,
          document.getPageCount()
        );
        for (const index of selected) {
          const source = document.getPage(index);
          const crop = source.getCropBox();
          const rotation = ((source.getRotation().angle % 360) + 360) % 360;
          const embedded =
            format === 'original'
              ? null
              : await output.embedPage(source, {
                  left: crop.x,
                  bottom: crop.y,
                  right: crop.x + crop.width,
                  top: crop.y + crop.height
                });
          const width = rotation % 180 ? crop.height : crop.width;
          const height = rotation % 180 ? crop.width : crop.height;
          pages.push({
            attachment,
            document,
            index,
            embedded,
            rotation,
            width,
            height,
            sourcePage: index + 1
          });
        }
      } else {
        const bytes = await imageBytes(attachment.bytes);
        const image =
          bytes[0] === 0xff
            ? await output.embedJpg(bytes)
            : await output.embedPng(bytes);
        pages.push({
          attachment,
          image,
          width: image.width,
          height: image.height,
          sourcePage: 1
        });
      }
    } catch (error) {
      error.resource = attachment.fileName;
      throw error;
    }
  }
  onProgress(model.labels.Information);
  const sheet = await renderPdf(
    <EntityPdfDocument
      model={{
        ...model,
        inlineDocuments: (model.inlineDocuments ?? []).map(document => ({
          ...document,
          files: document.files.map(file => ({
            ...file,
            image: preparedInlineImages.get(file.key)
          }))
        }))
      }}
      fontFamily={fontFamily}
      annexPageCount={pages.length}
    />
  );
  const sheetPages = await output.copyPages(sheet, sheet.getPageIndices());
  sheetPages.forEach(page => output.addPage(page));
  const seenDocuments = new Set();
  const framePages = pages.map((page, index) => {
    const reference = model.references.find(document =>
      document.files?.some(file => file.key === page.attachment.key)
    );
    const isFirstPage = !seenDocuments.has(page.attachment.documentId);
    seenDocuments.add(page.attachment.documentId);
    return {
      key: `${page.attachment.key}:${index}`,
      title:
        reference?.title ||
        page.attachment.documentTitle ||
        page.attachment.fileName,
      source: reference?.source,
      credit: isFirstPage && reference ? reference.credit : '',
      license: reference?.license ?? '',
      sourcePage: page.sourcePage,
      size:
        page.width > page.height ? [...PageSizes.A4].reverse() : PageSizes.A4
    };
  });
  if (pages.length > 0) {
    onProgress(model.labels.Documents);
    const frames = await renderPdf(
      <AnnexFrames
        model={model}
        fontFamily={fontFamily}
        pages={framePages}
        offset={sheetPages.length}
        total={sheetPages.length + pages.length}
      />
    );
    const copied = await output.copyPages(frames, frames.getPageIndices());
    for (let index = 0; index < pages.length; index++) {
      const source = pages[index];
      if (format === 'original' && source.document) {
        const [original] = await output.copyPages(source.document, [
          source.index
        ]);
        output.addPage(original);
        continue;
      }
      const page = output.addPage(copied[index]);
      const { width, height } = page.getSize();
      const scale = Math.min(
        (width - PDF_MARGIN * 2) / source.width,
        (height - ANNEX_TOP - ANNEX_BOTTOM) / source.height
      );
      const drawWidth = source.width * scale;
      const drawHeight = source.height * scale;
      const x = (width - drawWidth) / 2;
      const y =
        ANNEX_BOTTOM + (height - ANNEX_TOP - ANNEX_BOTTOM - drawHeight) / 2;
      if (source.image)
        page.drawImage(source.image, {
          x,
          y,
          width: drawWidth,
          height: drawHeight
        });
      else {
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
    }
  }
  /* eslint-enable no-await-in-loop */
  output.setTitle(model.title);
  output.setAuthor('Grottocenter');
  output.setSubject(model.source);
  output.setCreator('Grottocenter');
  return output.save();
};
