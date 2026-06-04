import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { InsertDriveFile } from '@mui/icons-material';

import GCLink from '../../components/common/GCLink';
import Property from '../../components/common/Properties/Property';
import ImageLightbox from '../../components/common/DocumentsList/ImageLightbox';
import ImageThumbnail from '../../components/common/DocumentsList/ImageThumbnail';
import {
  decodeFileName,
  getFileExtension,
  isImageFile
} from '../../components/common/DocumentsList/utils/imageUtils';
import { getFileIcon } from '../../components/common/DocumentsList/utils/fileIcons';

export const TextLink = ({ value, url }) =>
  url ? (
    <GCLink href={url} internal={url.startsWith('/ui')}>
      {value}
    </GCLink>
  ) : (
    <Typography component="span">{value}</Typography>
  );
TextLink.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  url: PropTypes.string
};

export const ListElement = ({ icon, value, secondary, url }) => {
  if (!value) return null;
  return (
    <ListItem>
      {icon && <ListItemIcon>{icon}</ListItemIcon>}
      <ListItemText
        primary={<TextLink value={value} url={url} />}
        secondary={secondary}
      />
    </ListItem>
  );
};
ListElement.propTypes = {
  icon: PropTypes.node,
  value: PropTypes.string,
  secondary: PropTypes.string,
  url: PropTypes.string
};

const HorizontalList = styled(List)`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  padding: 0;

  & .MuiListItem-root {
    width: initial;
  }

  & .MuiListItemText-secondary {
    white-space: pre-wrap;
  }
`;

export const EntitiesList = ({ children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return <HorizontalList>{items}</HorizontalList>;
};
EntitiesList.propTypes = { children: PropTypes.node };

export const SummaryText = ({ children }) => {
  if (!children) return null;
  return (
    <Typography
      component="div"
      variant="body1"
      sx={{ whiteSpace: 'pre-wrap' }}>
      {children}
    </Typography>
  );
};
SummaryText.propTypes = { children: PropTypes.node };

const PropertiesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  rowGap: theme.spacing(1.5),
  columnGap: theme.spacing(2)
}));

export const DetailsList = ({ children }) => {
  const items = React.Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
      <PropertiesGrid>{items}</PropertiesGrid>
    </Paper>
  );
};
DetailsList.propTypes = { children: PropTypes.node };

export const DetailItem = ({ icon, label, value, url, secondary = false }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <Property
      icon={icon}
      label={label}
      value={value}
      url={url}
      secondary={secondary}
      flexBasis="100%"
    />
  );
};
DetailItem.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.node
  ]),
  url: PropTypes.string,
  secondary: PropTypes.bool
};

export const FileListElement = ({ fileName, filePath }) => (
  <ListElement
    icon={getFileIcon(fileName)}
    value={decodeFileName(fileName)}
    url={filePath}
  />
);
FileListElement.propTypes = {
  fileName: PropTypes.string.isRequired,
  filePath: PropTypes.string.isRequired
};

const PdfPreview = styled('object')`
  border: 0;
  width: 100%;
  height: 600px;
  display: block;
  background: ${({ theme }) => theme.palette.grey[100]};
`;

const FileRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1)
}));

const EmptyFiles = ({ message }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      p: 4,
      color: 'text.secondary'
    }}>
    <InsertDriveFile fontSize="large" color="disabled" />
    <Typography variant="body2">{message}</Typography>
  </Box>
);
EmptyFiles.propTypes = { message: PropTypes.string.isRequired };

const ImageGallery = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(2)
}));

export const FilesSection = ({ files }) => {
  const { formatMessage } = useIntl();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fileList = useMemo(() => files ?? [], [files]);

  const images = useMemo(
    () => fileList.filter(f => isImageFile(f.fileName)),
    [fileList]
  );
  const pdfs = useMemo(
    () =>
      fileList.filter(f => getFileExtension(f.fileName) === '.pdf'),
    [fileList]
  );
  const others = useMemo(
    () =>
      fileList.filter(
        f =>
          !isImageFile(f.fileName) && getFileExtension(f.fileName) !== '.pdf'
      ),
    [fileList]
  );

  if (fileList.length === 0) {
    return (
      <EmptyFiles
        message={formatMessage({ id: 'No files attached to this document.' })}
      />
    );
  }

  return (
    <Stack spacing={3}>
      {images.length > 0 && (
        <ImageGallery>
          {images.map((file, idx) => (
            <ImageThumbnail
              key={file.completePath}
              src={file.completePath}
              alt={decodeFileName(file.fileName)}
              onClick={() => setLightboxIndex(idx)}
            />
          ))}
        </ImageGallery>
      )}

      {pdfs.map(file => (
        <Box key={file.completePath}>
          <Box sx={{ mb: 1 }}>
            <FileListElement
              fileName={file.fileName}
              filePath={file.completePath}
            />
          </Box>
          <PdfPreview data={file.completePath} type="application/pdf">
            <Typography variant="body2">
              <GCLink href={file.completePath}>
                {formatMessage({ id: 'Open PDF' })}
              </GCLink>
            </Typography>
          </PdfPreview>
        </Box>
      ))}

      {others.length > 0 && (
        <Stack spacing={1}>
          {others.map(file => (
            <FileRow key={file.completePath}>
              {getFileIcon(file.fileName)}
              <Box sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                <GCLink href={file.completePath}>
                  {decodeFileName(file.fileName)}
                </GCLink>
              </Box>
            </FileRow>
          ))}
        </Stack>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          open={lightboxIndex !== null}
          onClose={() => setLightboxIndex(null)}
          images={images}
          initialIndex={lightboxIndex}
        />
      )}
    </Stack>
  );
};
FilesSection.propTypes = {
  files: PropTypes.arrayOf(
    PropTypes.shape({
      fileName: PropTypes.string,
      completePath: PropTypes.string,
      description: PropTypes.string
    })
  )
};

export const ParentDocumentBlock = ({ parent }) => {
  const { formatMessage } = useIntl();
  if (!parent) return null;
  const hasRichContent =
    !!parent.description || (parent.files && parent.files.length > 0);
  if (!hasRichContent) return null;

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.50' }}>
      <Typography variant="caption" color="textSecondary">
        {formatMessage({ id: 'Parent document' })}
      </Typography>
      <Box sx={{ mt: 0.5, mb: 1 }}>
        <TextLink value={parent.title} url={`/ui/documents/${parent.id}`} />
      </Box>
      {parent.description && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {parent.description}
        </Typography>
      )}
    </Paper>
  );
};
ParentDocumentBlock.propTypes = {
  parent: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    description: PropTypes.string,
    files: PropTypes.arrayOf(PropTypes.shape({}))
  })
};
