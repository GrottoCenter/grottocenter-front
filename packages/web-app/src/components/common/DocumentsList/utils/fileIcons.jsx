import React from 'react';
import {
  PictureAsPdf,
  Image,
  Article,
  TableChart,
  InsertDriveFile
} from '@mui/icons-material';
import { getFileExtension } from './imageUtils';

const FILE_ICONS = {
  '.pdf': <PictureAsPdf fontSize="small" sx={{ color: '#d32f2f' }} />,
  '.svg': <Image fontSize="small" sx={{ color: '#7b61ff' }} />,
  '.doc': <Article fontSize="small" sx={{ color: '#1976d2' }} />,
  '.docx': <Article fontSize="small" sx={{ color: '#1976d2' }} />,
  '.xls': <TableChart fontSize="small" sx={{ color: '#388e3c' }} />,
  '.xlsx': <TableChart fontSize="small" sx={{ color: '#388e3c' }} />
};

export const getFileIcon = fileName =>
  FILE_ICONS[getFileExtension(fileName)] ?? (
    <InsertDriveFile fontSize="small" color="action" />
  );
