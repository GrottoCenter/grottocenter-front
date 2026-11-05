import { generateEntityPdf } from './generateEntityPdf';

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
      error:
        error.message === 'pdf.pagesError' ? error.message : 'pdf.exportError',
      resource: error.resource ?? '',
      cause: error.stack ?? error.message
    });
  }
};
