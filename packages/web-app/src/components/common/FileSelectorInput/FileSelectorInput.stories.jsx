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
  accept,
  extensions,
  disabled = false,
  multiple = true,
  maxSize
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
    <Box sx={{ maxWidth: theme => theme.spacing(112) }}>
      <FileSelectorInput
        accept={accept}
        extensions={extensions}
        disabled={disabled}
        multiple={multiple}
        maxSize={maxSize}
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
  initialRejections: PropTypes.arrayOf(PropTypes.string),
  accept: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string))
  ]),
  extensions: PropTypes.arrayOf(PropTypes.string),
  disabled: PropTypes.bool,
  multiple: PropTypes.bool,
  maxSize: PropTypes.number
};

export const Empty = {
  render: () => <StatefulSelector extensions={['.pdf', '.txt']} />
};

export const ManyFormats = {
  render: () => (
    <StatefulSelector
      extensions={[
        '.pdf',
        '.doc',
        '.docx',
        '.epub',
        '.jpg',
        '.png',
        '.svg',
        '.mp3',
        '.mp4',
        '.zip'
      ]}
    />
  )
};

export const WithSelectedFiles = {
  render: () => (
    <StatefulSelector
      extensions={['.pdf', '.txt']}
      initialFiles={[
        {
          fileName: 'Bulletin_CNM_1990.pdf',
          completePath: 'https://example.org/bulletin.pdf'
        },
        {
          fileName:
            'Applications of Electronic-Nose Technologies for Noninvasive Earl.pdf',
          completePath: 'https://example.org/article.pdf'
        }
      ]}
    />
  )
};

export const Disabled = {
  render: () => (
    <StatefulSelector
      disabled
      extensions={['.pdf', '.txt']}
      initialFiles={[{ fileName: 'read-only.pdf' }]}
    />
  )
};

export const RejectionByType = {
  render: () => (
    <StatefulSelector
      accept={{ 'application/pdf': ['.pdf'] }}
      extensions={['.pdf']}
      initialRejections={['malware.exe: file type not accepted']}
    />
  )
};

export const RejectionBySize = {
  render: () => <StatefulSelector maxSize={1024} extensions={['.txt']} />
};

export const SingleFile = {
  render: () => <StatefulSelector multiple={false} extensions={['.csv']} />
};
