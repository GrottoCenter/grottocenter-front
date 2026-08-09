import { useState } from 'react';

import DocumentSortSelect from './DocumentSortSelect';
import {
  DEFAULT_DOCUMENT_SORT_ORDER,
  DOCUMENT_SORT_ORDERS
} from '../../utils/documentSort';

// The control is fully controlled, so a plain `args` story would never move.
const StatefulSelect = () => {
  const [value, setValue] = useState(DEFAULT_DOCUMENT_SORT_ORDER);
  return <DocumentSortSelect value={value} onChange={setValue} />;
};

const TitleOrderSelect = () => {
  const [value, setValue] = useState(DOCUMENT_SORT_ORDERS.TITLE);
  return <DocumentSortSelect value={value} onChange={setValue} />;
};

const meta = {
  title: 'Common/DocumentSortSelect',
  component: DocumentSortSelect
};
export default meta;

export const Default = {
  render: () => <StatefulSelect />
};

// The one order whose label is a bare word rather than a composed one.
export const SortedByTitle = {
  render: () => <TitleOrderSelect />
};
