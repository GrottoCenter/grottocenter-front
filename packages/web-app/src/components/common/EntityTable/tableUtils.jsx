import React from 'react';
import BoolIcon from '../BoolIcon';
import entitiesConfig from './entitiesConfig';

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 100, 200];

// Maps display field -> API sort field for sortable columns, per entity type.
// `sortField` wins over `apiField` so a column can sort on a dedicated backend
// key while still exporting under its regular field name (e.g. the documents
// "Author" column exports `authors.nickname` but sorts on `authorsSort`).
export const SORT_FIELD_MAP = Object.fromEntries(
  Object.entries(entitiesConfig)
    .map(([type, config]) => [
      type,
      Object.fromEntries(
        config.columns
          .filter(col => col.sortable)
          .map(col => [col.field, col.sortField ?? col.apiField ?? col.field])
      )
    ])
    .filter(([, map]) => Object.keys(map).length > 0)
);

export const getObjectPath = (obj, path) => {
  const pathParts = path.split('.');
  let out = obj;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < pathParts.length; i++) {
    if (!out || typeof out !== 'object' || !(pathParts[i] in out)) return null;
    out = out[pathParts[i]];
  }
  return out;
};

export const renderCell = (doc, key, renderFn) => {
  const v = getObjectPath(doc, key);
  if (renderFn) {
    const rendered = renderFn(v, doc);
    return rendered != null ? rendered : '-';
  }
  if (v === true || v === false) return <BoolIcon value={v} />;
  if (v) return v;
  return '-';
};

export const getColumnsStorageKey = entityType =>
  `entityTable_${entityType}_columns`;

// Restores both column order and visibility from localStorage.
// Two stored formats are supported:
//  - legacy: an array of visible field names (order comes from the config)
//  - current: an ordered array of { field, visible } (order + visibility)
// Columns present in the config but missing from storage (e.g. a newly added
// column) are appended at the end, keeping their config default visibility.
export const applyColumnVisibility = (columns, storedVisibility) => {
  try {
    const parsed = JSON.parse(storedVisibility);
    if (!Array.isArray(parsed)) return columns;

    // Legacy format (array of visible field names): keep config order.
    if (parsed.length === 0 || typeof parsed[0] === 'string') {
      return columns.map(col => ({
        ...col,
        visible: parsed.includes(col.field)
      }));
    }

    const orderIndex = new Map(parsed.map((e, i) => [e.field, i]));
    const visibilityByField = new Map(parsed.map(e => [e.field, e.visible]));
    const known = columns
      .filter(col => orderIndex.has(col.field))
      .sort((a, b) => orderIndex.get(a.field) - orderIndex.get(b.field));
    const unknown = columns.filter(col => !orderIndex.has(col.field));
    return [...known, ...unknown].map(col => ({
      ...col,
      visible: visibilityByField.has(col.field)
        ? !!visibilityByField.get(col.field)
        : col.visible
    }));
  } catch (e) {
    return columns;
  }
};

// Persists the ordered visibility state for an entity type's columns.
export const persistColumnState = (entityType, columns) => {
  if (!entityType) return;
  const state = columns.map(({ field, visible }) => ({ field, visible }));
  localStorage.setItem(getColumnsStorageKey(entityType), JSON.stringify(state));
};

export const getStoredRowsPerPage = (
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS
) => {
  const stored = localStorage.getItem('entityTable_rowsPerPage');
  if (stored) {
    const value = parseInt(stored, 10);
    if (pageSizeOptions.includes(value)) return value;
  }
  return pageSizeOptions[0];
};
