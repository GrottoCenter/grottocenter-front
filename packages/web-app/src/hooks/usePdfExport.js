import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { createPdfMap, fetchPdfResource } from '@/pdf/shared/resources';
import { getPdfBrand } from '@/pdf/shared/brand';
import { PDF_LIMITS, PDF_ERROR_IDS, checkPdfLimit } from '@/pdf/shared/limits';

export const usePdfExport = () => {
  const { palette } = useTheme();
  const job = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const release = useCallback(() => {
    clearTimeout(job.current?.timeout);
    job.current?.controller.abort();
    job.current?.worker?.terminate();
    job.current = null;
  }, []);

  const cancel = useCallback(() => {
    release();
    setError(null);
    setProgress('');
    setIsGenerating(false);
  }, [release]);

  useEffect(() => release, [release]);

  const generate = useCallback(
    async ({ model, files, format, mapZoom }) => {
      cancel();
      const current = { controller: new AbortController(), worker: null };
      job.current = current;
      const { signal } = current.controller;
      setIsGenerating(true);
      let resource = model.title ?? '';
      current.timeout = setTimeout(() => {
        if (job.current !== current) return;
        setError({ id: 'pdf.exportError', resource });
        current.controller.abort();
        current.worker?.terminate();
      }, 120000);
      try {
        const prepared = {
          ...model,
          brand: await getPdfBrand(signal, palette)
        };
        if (model.coordinates) {
          resource = model.labels.Map;
          setProgress(resource);
          prepared.map = await createPdfMap(
            model.coordinates,
            mapZoom,
            signal,
            prepared.brand.colors
          );
        }
        const attachments = [];
        const inlineImages = [];
        const downloads = new Map();
        let totalBytes = 0;
        // Fetch originals serially to keep cancellation and file-specific errors deterministic.
        /* eslint-disable no-await-in-loop */
        for (const file of [
          ...files,
          ...(model.inlineDocuments ?? []).flatMap(document => document.files)
        ]) {
          resource = file.fileName;
          setProgress(resource);
          if (!downloads.has(file.url)) {
            const bytes = new Uint8Array(
              await fetchPdfResource(
                file.url,
                signal,
                PDF_LIMITS.resourceBytes - totalBytes
              )
            );
            totalBytes += bytes.byteLength;
            checkPdfLimit(totalBytes, PDF_LIMITS.resourceBytes);
            downloads.set(file.url, bytes);
          }
          const preparedFile = { ...file, bytes: downloads.get(file.url) };
          if (files.includes(file)) attachments.push(preparedFile);
          else inlineImages.push(preparedFile);
        }
        /* eslint-enable no-await-in-loop */
        signal.throwIfAborted();
        resource = model.labels.Information ?? model.title ?? '';
        setProgress(resource);
        current.worker = new Worker(
          new URL('../pdf/shared/pdfExport.worker.js', import.meta.url),
          { type: 'module' }
        );
        // Termination cannot deliver a reply: resolve the obsolete job on abort.
        const data = await new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => resolve(null), {
            once: true
          });
          current.worker.onmessage = event => {
            if (job.current !== current || signal.aborted) return;
            if (event.data.progress) {
              resource = event.data.progress;
              setProgress(resource);
            } else resolve(event.data);
          };
          current.worker.onerror = event => reject(new Error(event.message));
          current.worker.onmessageerror = () =>
            reject(new Error('Unable to read PDF worker response'));
          const transfers = [...downloads.values()].map(bytes => bytes.buffer);
          if (prepared.map) transfers.push(prepared.map.image.buffer);
          current.worker.postMessage(
            { model: prepared, attachments, inlineImages, format },
            transfers
          );
        });
        if (job.current !== current || !data) return null;
        if (data.error) {
          console.error('PDF generation failed', data.cause ?? data.error);
          setError({ id: data.error, resource: data.resource || model.title });
          return null;
        }
        return new Blob([data.bytes], { type: 'application/pdf' });
      } catch (_cause) {
        if (job.current === current && !signal.aborted) {
          current.controller.abort();
          console.error('PDF export failed', _cause);
          setError({
            id: PDF_ERROR_IDS.has(_cause.message)
              ? _cause.message
              : 'pdf.exportError',
            resource
          });
        }
        return null;
      } finally {
        clearTimeout(current.timeout);
        current.worker?.terminate();
        if (job.current === current) {
          job.current = null;
          setIsGenerating(false);
          setProgress('');
        }
      }
    },
    [cancel, palette]
  );

  return { generate, cancel, isGenerating, error, progress };
};
