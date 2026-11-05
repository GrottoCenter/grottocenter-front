import { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { createPdfMap, fetchPdfResource } from '@/pdf/shared/resources';
import { getPdfBrand } from '@/pdf/shared/brand';

export const usePdfExport = () => {
  const { palette } = useTheme();
  const job = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const release = useCallback(() => {
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
      let resource = '';
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
        // Fetch originals serially to keep cancellation and file-specific errors deterministic.
        /* eslint-disable no-await-in-loop */
        for (const file of [
          ...files,
          ...(model.inlineDocuments ?? []).flatMap(document => document.files)
        ]) {
          resource = file.fileName;
          setProgress(resource);
          if (!downloads.has(file.url))
            downloads.set(
              file.url,
              new Uint8Array(await fetchPdfResource(file.url, signal))
            );
          const preparedFile = { ...file, bytes: downloads.get(file.url) };
          if (files.includes(file)) attachments.push(preparedFile);
          else inlineImages.push(preparedFile);
        }
        /* eslint-enable no-await-in-loop */
        signal.throwIfAborted();
        resource = '';
        setProgress('');
        current.worker = new Worker(
          new URL('../pdf/shared/worker.js', import.meta.url),
          { type: 'module' }
        );
        // Termination cannot deliver a reply: resolve the obsolete job on abort.
        const data = await new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () =>
              reject(new Error('PDF worker did not finish within two minutes')),
            120000
          );
          const finish = (callback, value) => {
            clearTimeout(timeout);
            callback(value);
          };
          signal.addEventListener('abort', () => finish(resolve, null), {
            once: true
          });
          current.worker.onmessage = event => {
            if (job.current !== current || signal.aborted) return;
            if (event.data.progress) {
              resource = event.data.progress;
              setProgress(resource);
            } else finish(resolve, event.data);
          };
          current.worker.onerror = event =>
            finish(reject, new Error(event.message));
          current.worker.onmessageerror = () =>
            finish(reject, new Error('Unable to read PDF worker response'));
          const transfers = [...downloads.values()].map(bytes => bytes.buffer);
          if (prepared.map) transfers.push(prepared.map.image.buffer);
          try {
            current.worker.postMessage(
              { model: prepared, attachments, inlineImages, format },
              transfers
            );
          } catch (cause) {
            finish(reject, cause);
          }
        });
        if (job.current !== current || !data) return null;
        if (data.error) {
          console.error('PDF generation failed', data.cause ?? data.error);
          setError({ id: data.error, resource: data.resource });
          return null;
        }
        return new Blob([data.bytes], { type: 'application/pdf' });
      } catch (_cause) {
        if (job.current === current && !signal.aborted) {
          current.controller.abort();
          console.error('PDF export failed', _cause);
          setError({ id: 'pdf.exportError', resource });
        }
        return null;
      } finally {
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
