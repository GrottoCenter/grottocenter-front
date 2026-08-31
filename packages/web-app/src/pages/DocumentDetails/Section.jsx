import { Children, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Box, Paper, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { EventAvailable, InsertDriveFile } from '@mui/icons-material';
import Linkify from 'linkify-react';

import PdfPreview from '@/components/common/PdfPreview';
import { ListElement } from '@/components/common/LinkedEntitiesList';
import AppLink from '../../components/common/AppLink';
import linkifyOptions from '../../helpers/linkifyOptions';
import Property from '../../components/common/Properties/Property';
import ImageLightbox from '../../components/common/DocumentsList/ImageLightbox';
import ImageThumbnail, {
  ThumbnailsGrid
} from '../../components/common/DocumentsList/ImageThumbnail';
import {
  decodeFileName,
  getFileExtension,
  getThumbnailSources,
  isImageFile
} from '../../components/common/DocumentsList/utils/imageUtils';
import { getFileIcon } from '../../components/common/DocumentsList/utils/fileIcons';
import { ThumbnailsPropTypes } from '../../types/document.type';

// Takes the raw text and linkifies it itself. Callers used to pass
// `<Linkify>{description}</Linkify>`, which made `children` a truthy element
// even for an empty description: the guard below never fired and the component
// rendered an empty block that still counted as a flex child, adding a gap
// above the next section.
export const SummaryText = ({ children }) => {
  if (!children?.trim()) return null;
  return (
    <Typography component="div" variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
      <Linkify options={linkifyOptions}>{children}</Linkify>
    </Typography>
  );
};
SummaryText.propTypes = { children: PropTypes.string };

const PropertiesGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  columnGap: theme.spacing(1)
}));

const PropertyCell = styled('div', {
  shouldForwardProp: prop => prop !== 'fullWidth'
})(({ fullWidth }) => ({
  gridColumn: fullWidth ? '1 / -1' : 'auto',
  minWidth: 0
}));

export const DetailsList = ({ children }) => {
  const items = Children.toArray(children).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1, borderRadius: 2, bgcolor: 'grey.50' }}>
      <PropertiesGrid>{items}</PropertiesGrid>
    </Paper>
  );
};
DetailsList.propTypes = { children: PropTypes.node };

export const DetailItem = ({
  icon,
  label,
  value,
  url,
  secondary = false,
  fullWidth = false
}) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <PropertyCell fullWidth={fullWidth}>
      <Property
        icon={icon}
        label={label}
        value={value}
        url={url}
        secondary={secondary}
        flexBasis="100%"
      />
    </PropertyCell>
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
  secondary: PropTypes.bool,
  fullWidth: PropTypes.bool
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

// The images *are* the document here, not entries in a list, so they get a
// taller cap than the documents list default — the ceiling VideoPreview below
// uses at `md`.
const DOCUMENT_IMAGE_MAX_HEIGHT = 600;

const VideoPreview = styled('video')(({ theme }) => ({
  width: '100%',
  maxHeight: 320,
  display: 'block',
  background: theme.palette.common.black,
  borderRadius: theme.spacing(0.5),
  [theme.breakpoints.up('sm')]: { maxHeight: 480 },
  [theme.breakpoints.up('md')]: { maxHeight: 600 }
}));

const AudioPreview = styled('audio')`
  width: 100%;
  display: block;
`;

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.ogv']);
const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.ogg',
  '.wav',
  '.m4a',
  '.flac',
  '.aac',
  '.opus'
]);

const isVideoFile = fileName =>
  VIDEO_EXTENSIONS.has(getFileExtension(fileName));
const isAudioFile = fileName =>
  AUDIO_EXTENSIONS.has(getFileExtension(fileName));

const FileRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0.5),
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(0.5)
}));

export const EmptySection = ({ icon, message }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1,
      borderRadius: 2,
      bgcolor: 'grey.50',
      minHeight: { xs: 100, sm: 200 },
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.5,
      color: 'text.secondary'
    }}>
    {icon ?? <InsertDriveFile fontSize="large" color="disabled" />}
    <Typography variant="body2">{message}</Typography>
  </Paper>
);
EmptySection.propTypes = {
  icon: PropTypes.node,
  message: PropTypes.string.isRequired
};

export const EventDateSection = ({ date }) => {
  const { formatMessage } = useIntl();
  if (!date) return null;
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
      <EventAvailable sx={{ fontSize: 40, color: 'text.secondary' }} />
      <Box>
        <Typography variant="caption" color="text.secondary" display="block">
          {formatMessage({ id: 'Event date' })}
        </Typography>
        <Typography variant="h5">{date}</Typography>
      </Box>
    </Paper>
  );
};
EventDateSection.propTypes = { date: PropTypes.string };

export const FilesSection = ({ files }) => {
  const { formatMessage } = useIntl();
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const fileList = useMemo(() => files ?? [], [files]);

  const images = useMemo(
    () => fileList.filter(f => isImageFile(f.fileName)),
    [fileList]
  );
  const pdfs = useMemo(
    () => fileList.filter(f => getFileExtension(f.fileName) === '.pdf'),
    [fileList]
  );
  const videos = useMemo(
    () => fileList.filter(f => isVideoFile(f.fileName)),
    [fileList]
  );
  const audios = useMemo(
    () => fileList.filter(f => isAudioFile(f.fileName)),
    [fileList]
  );
  const others = useMemo(
    () =>
      fileList.filter(
        f =>
          !isImageFile(f.fileName) &&
          !isVideoFile(f.fileName) &&
          !isAudioFile(f.fileName) &&
          getFileExtension(f.fileName) !== '.pdf'
      ),
    [fileList]
  );

  if (fileList.length === 0) {
    return (
      <EmptySection
        message={formatMessage({ id: 'No files attached to this document.' })}
      />
    );
  }

  return (
    <Stack spacing={2}>
      {images.length > 0 && (
        <ThumbnailsGrid $count={images.length}>
          {images.map((file, idx) => {
            const { src, srcSet } = getThumbnailSources(file);
            return (
              <ImageThumbnail
                key={file.completePath}
                src={src}
                srcSet={srcSet}
                maxHeight={DOCUMENT_IMAGE_MAX_HEIGHT}
                alt={decodeFileName(file.fileName)}
                onClick={() => setLightboxIndex(idx)}
              />
            );
          })}
        </ThumbnailsGrid>
      )}
      {pdfs.map(file => (
        <Box key={file.completePath}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.5
            }}>
            {getFileIcon(file.fileName)}
            <AppLink href={file.completePath}>
              {decodeFileName(file.fileName)}
            </AppLink>
          </Box>
          <PdfPreview src={file.completePath} />
        </Box>
      ))}
      {videos.map(file => (
        <Box key={file.completePath}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.5
            }}>
            {getFileIcon(file.fileName)}
            <AppLink href={file.completePath}>
              {decodeFileName(file.fileName)}
            </AppLink>
          </Box>
          <VideoPreview controls preload="metadata" src={file.completePath} />
        </Box>
      ))}
      {audios.map(file => (
        <Box key={file.completePath}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              mb: 0.5
            }}>
            {getFileIcon(file.fileName)}
            <AppLink href={file.completePath}>
              {decodeFileName(file.fileName)}
            </AppLink>
          </Box>
          <AudioPreview controls preload="metadata" src={file.completePath} />
        </Box>
      ))}
      {others.length > 0 && (
        <Stack spacing={0.5}>
          {others.map(file => (
            <FileRow key={file.completePath}>
              {getFileIcon(file.fileName)}
              <Box sx={{ flex: 1, minWidth: 0, wordBreak: 'break-word' }}>
                <AppLink href={file.completePath}>
                  {decodeFileName(file.fileName)}
                </AppLink>
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
      description: PropTypes.string,
      thumbnails: ThumbnailsPropTypes
    })
  )
};
