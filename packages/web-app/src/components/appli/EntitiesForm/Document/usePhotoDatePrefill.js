import { useEffect, useRef } from 'react';

import { readPhotoDate } from '@/utils/photoDate';
import { documentTypeHelpers } from '@/utils/documentTypeHelpers';
import { IS_NEW } from './formElements/AddFileForm/FileHelpers';

const { isImage } = documentTypeHelpers;

const usePhotoDatePrefill = ({
  document,
  setDocument,
  attributeVersionsRef,
  allowPrefillRef
}) => {
  const datesRef = useRef(new WeakMap());
  const { files, type, datePublication } = document;

  useEffect(() => {
    if (!allowPrefillRef.current || datePublication || !isImage(type))
      return undefined;

    let isCurrent = true;
    const dateVersion = attributeVersionsRef.current.datePublication;
    const typeVersion = attributeVersionsRef.current.type;
    const candidates = files.filter(
      entry => entry.state === IS_NEW && entry.file instanceof File
    );

    // Read in attachment order, even when several files or batches arrive.
    // Cache by File identity so unrelated attachment edits do not reread it.
    const findDate = async index => {
      const entry = candidates[index];
      if (!isCurrent || !entry) return null;
      const { file } = entry;
      if (!datesRef.current.has(file)) {
        datesRef.current.set(file, readPhotoDate(file));
      }
      const date = await datesRef.current.get(file);
      if (!isCurrent) return null;
      return date ? { file, date } : findDate(index + 1);
    };

    const prefill = async () => {
      const result = await findDate(0);
      if (!isCurrent || !result) return;
      const { file, date } = result;
      setDocument(current => {
        if (
          !isCurrent ||
          !allowPrefillRef.current ||
          current.datePublication ||
          current.type !== type ||
          attributeVersionsRef.current.datePublication !== dateVersion ||
          attributeVersionsRef.current.type !== typeVersion ||
          !current.files.some(
            item => item.file === file && item.state === IS_NEW
          )
        )
          return current;
        return { ...current, datePublication: date };
      });
    };
    prefill();

    return () => {
      isCurrent = false;
    };
  }, [
    files,
    type,
    datePublication,
    allowPrefillRef,
    setDocument,
    attributeVersionsRef
  ]);
};

export default usePhotoDatePrefill;
