import { findPersonDuplicates } from '../utils/personDuplicates';

globalThis.onmessage = ({ data }) => {
  const pairs = findPersonDuplicates(data, (loaded, total) => {
    globalThis.postMessage({ progress: { loaded, total, phase: 'matching' } });
  });
  globalThis.postMessage({ pairs });
};
