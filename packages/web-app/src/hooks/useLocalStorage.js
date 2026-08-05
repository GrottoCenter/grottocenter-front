import { useState, useCallback, useRef } from 'react';

/**
 * useState backed by localStorage.
 *
 * @param {string} key           - localStorage key
 * @param {*}      defaultValue  - value used when nothing is stored yet
 * @param {object} [options]
 * @param {function} [options.serialize=JSON.stringify]   - value → string
 * @param {function} [options.deserialize=JSON.parse]     - string → value
 * @param {boolean}  [options.merge=false]                - when true, spreads
 *   the stored plain object over defaultValue so new keys always get their
 *   default (safe against schema evolution)
 */
const useLocalStorage = (
  key,
  defaultValue,
  { serialize = JSON.stringify, deserialize = JSON.parse, merge = false } = {}
) => {
  // Keep serialize/deserialize in refs so they never invalidate the setter.
  const serRef = useRef(serialize);
  const desRef = useRef(deserialize);

  const [value, setValueRaw] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return defaultValue;
      const stored = desRef.current(raw);
      if (
        merge &&
        stored &&
        typeof stored === 'object' &&
        !Array.isArray(stored)
      ) {
        return { ...defaultValue, ...stored };
      }
      return stored;
    } catch {
      return defaultValue;
    }
  });

  const setValue = useCallback(
    next => {
      setValueRaw(prev => {
        const nextValue = typeof next === 'function' ? next(prev) : next;
        try {
          localStorage.setItem(key, serRef.current(nextValue));
        } catch {
          /* noop — storage quota or private mode */
        }
        return nextValue;
      });
    },
    [key]
  );

  return [value, setValue];
};

export default useLocalStorage;
