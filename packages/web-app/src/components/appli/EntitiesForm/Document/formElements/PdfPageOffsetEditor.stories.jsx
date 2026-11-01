import { useState } from 'react';
import PdfPageOffsetEditor from './PdfPageOffsetEditor';

const NewMapping = () => {
  const [value, setValue] = useState(null);
  return (
    <PdfPageOffsetEditor
      value={value}
      onChange={setValue}
      src="https://example.org/bulletin.pdf"
    />
  );
};

const SavedMapping = () => {
  const [value, setValue] = useState(1);
  return (
    <PdfPageOffsetEditor
      value={value}
      onChange={setValue}
      src="https://example.org/bulletin.pdf"
    />
  );
};

const meta = {
  title: 'Forms/Document/PdfPageOffsetEditor',
  component: PdfPageOffsetEditor,
  parameters: { layout: 'padded' }
};

export default meta;
export const Default = { render: NewMapping };
export const Existing = { render: SavedMapping };
