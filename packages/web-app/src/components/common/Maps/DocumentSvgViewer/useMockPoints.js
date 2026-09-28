import { useCallback } from 'react';

import useLocalStorage from '@/hooks/useLocalStorage';

const STORAGE_KEY = 'grottocenter_mockPoints';
const EMPTY = [];

// TEMPORARY client-side mock. Points have no backend yet, so points created by
// right-clicking the SVG viewer are persisted in localStorage, keyed by the SVG
// url (each document/topo keeps its own points). Stored shape matches the
// viewer's `points` prop: { id, label, coordinates: [u, v], documents: [...] }.
// Replace with a real API / Redux slice once the endpoint exists.
const useMockPoints = svgKey => {
  const [byKey, setByKey] = useLocalStorage(STORAGE_KEY, {});

  const points = byKey[svgKey] ?? EMPTY;

  const addPoint = useCallback(
    ({ label, coordinates, documents }) => {
      const id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `point-${Date.now()}`;
      const point = { id, label, coordinates, documents: documents ?? [] };
      setByKey(prev => ({
        ...prev,
        [svgKey]: [...(prev[svgKey] ?? []), point]
      }));
      return point;
    },
    [setByKey, svgKey]
  );

  // Merge a partial patch (label, documents and/or coordinates) into a point.
  const updatePoint = useCallback(
    (id, patch) => {
      setByKey(prev => ({
        ...prev,
        [svgKey]: (prev[svgKey] ?? []).map(p =>
          p.id === id ? { ...p, ...patch } : p
        )
      }));
    },
    [setByKey, svgKey]
  );

  return { points, addPoint, updatePoint };
};

export default useMockPoints;
