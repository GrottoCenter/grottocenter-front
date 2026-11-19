import { useState } from 'react';
import PanoramaDisplayEditor from './PanoramaDisplayEditor';

const EditorStory = ({ value, isNew, error }) => {
  const [choice, setChoice] = useState(value);
  return (
    <PanoramaDisplayEditor
      value={choice}
      isNew={isNew}
      error={error}
      onChange={setChoice}
    />
  );
};
EditorStory.propTypes = PanoramaDisplayEditor.propTypes;

const meta = {
  title: 'Forms/Document/PanoramaDisplayEditor',
  component: PanoramaDisplayEditor,
  render: EditorStory,
  args: { isNew: true }
};
export default meta;

export const Automatic = {};
export const Enabled = { args: { value: true } };
export const Disabled = { args: { value: false } };
export const ExistingPanorama = { args: { value: true, isNew: false } };
export const IncompatibleImage = {
  args: { value: true, error: 'E_INCOMPATIBLE_PANORAMA' }
};
