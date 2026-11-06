import { generateEntityPdf } from './generateEntityPdf';
import { PDF_ERROR_IDS } from './limits';

globalThis.onmessage = async ({ data }) => {
  try {
    const bytes = await generateEntityPdf(data.model, data.attachments, {
      format: data.format,
      inlineImages: data.inlineImages,
      onProgress: progress => globalThis.postMessage({ progress })
    });
    globalThis.postMessage({ bytes }, [bytes.buffer]);
  } catch (error) {
    globalThis.postMessage({
      error: PDF_ERROR_IDS.has(error.message)
        ? error.message
        : 'pdf.exportError',
      resource: error.resource ?? '',
      cause: error.stack ?? error.message
    });
  }
};
