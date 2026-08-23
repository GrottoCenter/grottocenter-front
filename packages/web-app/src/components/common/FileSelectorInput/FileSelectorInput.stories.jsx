import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import Alert from '../Alert';
import FileSelectorInput, { REJECTION_REASONS } from './index';

const meta = {
  title: 'Common/FileSelectorInput',
  component: FileSelectorInput,
  parameters: { layout: 'padded' }
};
export default meta;

const StatefulSelector = ({
  initialFiles,
  initialRejections = [],
  ...props
}) => {
  const [files, setFiles] = useState(initialFiles ?? []);
  const [rejections, setRejections] = useState(initialRejections);

  const onFilesAdd = filesToAdd => {
    setRejections([]);
    setFiles(prev => [
      ...prev,
      ...Array.from(filesToAdd).map(f => ({ fileName: f.name, file: f }))
    ]);
  };
  const onFileRemove = fileName =>
    setFiles(prev => prev.filter(f => f.fileName !== fileName));
  const onFileRejections = normalized => {
    const messages = normalized.map(({ fileName, reasons }) => {
      if (reasons.includes(REJECTION_REASONS.TOO_LARGE))
        return `${fileName}: file is too large`;
      if (reasons.includes(REJECTION_REASONS.TYPE_NOT_ACCEPTED))
        return `${fileName}: file type not accepted`;
      if (reasons.includes(REJECTION_REASONS.TOO_MANY_FILES))
        return `${fileName}: too many files`;
      return `${fileName}: rejected`;
    });
    setRejections(messages);
  };

  return (
    <Box sx={{ maxWidth: 480 }}>
      <FileSelectorInput
        {...props}
        files={files}
        onFilesAdd={onFilesAdd}
        onFileRemove={onFileRemove}
        onFileRejections={onFileRejections}
      />
      {rejections.map(msg => (
        <Alert key={msg} content={msg} severity="error" />
      ))}
    </Box>
  );
};

StatefulSelector.propTypes = {
  initialFiles: PropTypes.arrayOf(
    PropTypes.shape({ fileName: PropTypes.string.isRequired })
  ),
  initialRejections: PropTypes.arrayOf(PropTypes.string)
};

export const Empty = {
  render: () => <StatefulSelector extensions={['pdf', 'txt']} />
};

export const WithSelectedFiles = {
  render: () => (
    <StatefulSelector
      extensions={['pdf', 'txt']}
      initialFiles={[{ fileName: 'photo.jpg' }, { fileName: 'notes.pdf' }]}
    />
  )
};

export const Disabled = {
  render: () => (
    <StatefulSelector
      disabled
      extensions={['pdf', 'txt']}
      initialFiles={[{ fileName: 'read-only.pdf' }]}
    />
  )
};

export const RejectionByType = {
  render: () => (
    <StatefulSelector
      accept={{ 'application/pdf': ['.pdf'] }}
      extensions={['pdf']}
      initialRejections={['malware.exe: file type not accepted']}
    />
  )
};

export const RejectionBySize = {
  render: () => <StatefulSelector maxSize={1024} extensions={['txt']} />
};

export const SingleFile = {
  render: () => <StatefulSelector multiple={false} extensions={['csv']} />
};
