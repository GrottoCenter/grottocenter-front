import {
  PictureAsPdf,
  Image,
  Article,
  TableChart,
  InsertDriveFile
} from '@mui/icons-material';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import { getFileExtension } from './imageUtils';

// glTF logo green, from the Khronos Logo Family Color Guide (also used for GLB).
const GLTF_COLOR = '#87c540';

const FILE_ICONS = {
  '.glb': <ViewInArIcon fontSize="small" sx={{ color: GLTF_COLOR }} />,
  '.gltf': <ViewInArIcon fontSize="small" sx={{ color: GLTF_COLOR }} />,
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
