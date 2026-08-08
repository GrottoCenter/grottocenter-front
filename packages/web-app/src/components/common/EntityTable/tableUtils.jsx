import BoolIcon from '../BoolIcon';
import entitiesConfig from './entitiesConfig';

const DEFAULT_PAGE_SIZE_OPTIONS = [20, 100, 200];

// The results toolbar's action cluster is built on ToolbarActionButton, but the
// page-size Select cannot be — so the height they have to agree on lives here
// rather than in either of them. 32px is what a small bordered button already
// measures, so nothing grows to meet it.
export const TOOLBAR_ACTION_HEIGHT = 32;

// Maps display field -> API sort field for sortable columns, per entity type.
export const SORT_FIELD_MAP = Object.fromEntries(
  Object.entries(entitiesConfig)
    .map(([type, config]) => [
      type,
      Object.fromEntries(
        config.columns
          .filter(col => col.sortable)
          .map(col => [col.field, col.apiField ?? col.field])
      )
    ])
    .filter(([, map]) => Object.keys(map).length > 0)
);

export const getObjectPath = (obj, path) => {
  const pathParts = path.split('.');
  let out = obj;
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

export const applyColumnVisibility = (columns, storedVisibility) => {
  try {
    const visibleFields = JSON.parse(storedVisibility);
    return columns.map(col => ({
      ...col,
      visible: visibleFields.includes(col.field)
    }));
  } catch {
    return columns;
  }
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
