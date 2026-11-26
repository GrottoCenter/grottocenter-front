import { useState } from 'react';
import VisibleColumnsMenu from './VisibleColumnsMenu';

const ColumnsExample = () => {
  const [columns, setColumns] = useState([
    { field: 'title', label: 'Title', visible: true },
    { field: 'authors', label: 'Author', visible: true },
    { field: 'hasFiles', label: 'File available', visible: true },
    { field: 'entrances', label: 'Entrances', visible: false }
  ]);
  return (
    <VisibleColumnsMenu
      columns={columns}
      setColumns={setColumns}
      label="Change columns"
    />
  );
};

export default {
  title: 'EntityTable/VisibleColumnsMenu',
  component: VisibleColumnsMenu
};

export const VisibilityAndOrder = { render: () => <ColumnsExample /> };
