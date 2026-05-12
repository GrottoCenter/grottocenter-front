import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Grid,
  Skeleton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ImageIcon from '@mui/icons-material/Image';
import DrawIcon from '@mui/icons-material/Draw';
import ArticleIcon from '@mui/icons-material/Article';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import BookmarksIcon from '@mui/icons-material/Bookmarks';
import EventIcon from '@mui/icons-material/Event';
import MapIcon from '@mui/icons-material/Map';
import DatasetIcon from '@mui/icons-material/Dataset';
import LayersIcon from '@mui/icons-material/Layers';
import MovieIcon from '@mui/icons-material/Movie';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import MiscellaneousServicesIcon from '@mui/icons-material/MiscellaneousServices';
import TerminalIcon from '@mui/icons-material/Terminal';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

import { DocumentTypes } from '../../../../../hooks/useDocumentTypes';
import { DocumentFormContext } from '../Provider';
import { loadDocumentTypes } from '../../../../../actions/DocumentType';

const TYPE_ICONS = {
  [DocumentTypes.IMAGE]: <ImageIcon />,
  [DocumentTypes.TOPOGRAPHIC_DRAWING]: <DrawIcon />,
  [DocumentTypes.ARTICLE]: <ArticleIcon />,
  [DocumentTypes.BOOK]: <MenuBookIcon />,
  [DocumentTypes.ISSUE]: <NewspaperIcon />,
  [DocumentTypes.COLLECTION]: <BookmarksIcon />,
  [DocumentTypes.EVENT]: <EventIcon />,
  [DocumentTypes.MAP]: <MapIcon />,
  [DocumentTypes.DATASET]: <DatasetIcon />,
  [DocumentTypes.TOPOGRAPHIC_DATA]: <LayersIcon />,
  [DocumentTypes.MOVING_IMAGE]: <MovieIcon />,
  [DocumentTypes.SOUND]: <HeadphonesIcon />,
  [DocumentTypes.AUTHORIZATION_TO_PUBLISH]: <GavelIcon />,
  [DocumentTypes.TEXT]: <DescriptionIcon />,
  [DocumentTypes.STILL_IMAGE]: <PhotoLibraryIcon />,
  [DocumentTypes.INTERACTIVE_RESOURCE]: <TouchAppIcon />,
  [DocumentTypes.PHYSICAL_OBJECT]: <ViewInArIcon />,
  [DocumentTypes.SERVICE]: <MiscellaneousServicesIcon />,
  [DocumentTypes.SOFTWARE]: <TerminalIcon />
};

const FEATURED_TYPES = [
  DocumentTypes.IMAGE,
  DocumentTypes.TOPOGRAPHIC_DRAWING,
  DocumentTypes.MOVING_IMAGE
];

const docTypePropType = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string.isRequired,
  comment: PropTypes.string
});

const FeaturedCard = ({ docType, selected, onClick }) => {
  const { formatMessage } = useIntl();
  const icon = TYPE_ICONS[docType.name] ?? <InsertDriveFileIcon />;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: selected ? 'primary.main' : 'divider',
        borderWidth: selected ? 2 : 1,
        bgcolor: selected ? 'action.selected' : 'background.paper',
        transition: 'border-color 0.15s, background-color 0.15s',
        height: '100%'
      }}>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            py: 3,
            position: 'relative'
          }}>
          <Box
            sx={{
              color: selected ? 'primary.main' : 'text.secondary',
              display: 'flex',
              '& svg': { fontSize: 40 }
            }}>
            {icon}
          </Box>
          <Typography
            variant="subtitle1"
            fontWeight={600}
            color={selected ? 'primary.main' : 'text.primary'}>
            {formatMessage({ id: docType.name })}
          </Typography>
          {selected && (
            <CheckCircleIcon
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: 18,
                color: 'primary.main'
              }}
            />
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

FeaturedCard.propTypes = {
  docType: docTypePropType.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

const SecondaryCard = ({ docType, selected, onClick }) => {
  const { formatMessage } = useIntl();
  const icon = TYPE_ICONS[docType.name] ?? <InsertDriveFileIcon />;

  return (
    <Tooltip
      title={docType.comment ? formatMessage({ id: docType.comment }) : ''}
      placement="top">
      <Card
        variant="outlined"
        sx={{
          borderColor: selected ? 'primary.main' : 'divider',
          borderWidth: selected ? 2 : 1,
          bgcolor: selected ? 'action.selected' : 'background.paper',
          transition: 'border-color 0.15s, background-color 0.15s'
        }}>
        <CardActionArea onClick={onClick}>
          <CardContent
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              py: 1.5,
              '&:last-child': { pb: 1.5 }
            }}>
            <Box
              sx={{
                color: selected ? 'primary.main' : 'text.secondary',
                display: 'flex',
                flexShrink: 0,
                mr: 1,
                '& svg': { fontSize: 20 }
              }}>
              {icon}
            </Box>
            <Typography
              variant="body2"
              fontWeight={selected ? 600 : 400}
              color={selected ? 'primary.main' : 'text.primary'}
              noWrap>
              {formatMessage({ id: docType.name })}
            </Typography>
          </CardContent>
        </CardActionArea>
      </Card>
    </Tooltip>
  );
};

SecondaryCard.propTypes = {
  docType: docTypePropType.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

const DocumentTypeSelect = () => {
  const { document, resetContext } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isLoaded, documentTypes } = useSelector(state => state.documentType);
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    if (!isLoaded) dispatch(loadDocumentTypes());
  }, [dispatch, isLoaded]);

  // Open others section if selected type is not featured
  useEffect(() => {
    if (document.type !== -1 && !FEATURED_TYPES.includes(document.type)) {
      setOthersOpen(true);
    }
  }, [document.type]);

  const handleSelect = newDocType => {
    const { title, mainLanguage, mainLanguageName } = document;
    resetContext({ type: newDocType, title, mainLanguage, mainLanguageName });
  };

  const featured = documentTypes.filter(dt => FEATURED_TYPES.includes(dt.name));
  const others = documentTypes.filter(dt => !FEATURED_TYPES.includes(dt.name));
  const selectedOther = others.find(dt => dt.name === document.type) ?? null;

  if (!isLoaded) {
    return (
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          {[0, 1].map(i => (
            <Grid size={6} key={i}>
              <Skeleton variant="rounded" height={110} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Grid container spacing={2} alignItems="stretch">
        {featured.map(dt => (
          <Grid size={4} key={dt.id}>
            <FeaturedCard
              docType={dt}
              selected={document.type === dt.name}
              onClick={() => handleSelect(dt.name)}
            />
          </Grid>
        ))}
      </Grid>

      {others.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {isMobile && (
            <Box
              onClick={() => setOthersOpen(o => !o)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: selectedOther ? 'primary.main' : 'divider',
                borderRadius: 1,
                px: 2,
                py: 1,
                bgcolor: selectedOther ? 'action.selected' : 'background.paper',
                '&:hover': {
                  borderColor: selectedOther
                    ? 'primary.main'
                    : 'text.secondary',
                  bgcolor: 'action.hover'
                },
                userSelect: 'none',
                mb: 1
              }}>
              {selectedOther && (
                <Box
                  sx={{
                    color: 'primary.main',
                    display: 'flex',
                    '& svg': { fontSize: 20 }
                  }}>
                  {TYPE_ICONS[selectedOther.name] ?? <InsertDriveFileIcon />}
                </Box>
              )}
              <Typography
                variant="body2"
                fontWeight={500}
                color={selectedOther ? 'primary.main' : 'text.primary'}
                sx={{ flex: 1 }}>
                {selectedOther
                  ? formatMessage({ id: selectedOther.name })
                  : formatMessage({ id: 'Other types' })}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: 'action.selected',
                  borderRadius: 10,
                  px: 1,
                  py: 0.25,
                  fontWeight: 600
                }}>
                {others.length}
              </Typography>
              {othersOpen ? (
                <ExpandLessIcon
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              ) : (
                <ExpandMoreIcon
                  fontSize="small"
                  sx={{ color: 'text.secondary' }}
                />
              )}
            </Box>
          )}

          <Collapse in={isMobile ? othersOpen : true}>
            <Grid container spacing={1}>
              {others.map(dt => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={dt.id}>
                  <SecondaryCard
                    docType={dt}
                    selected={document.type === dt.name}
                    onClick={() => handleSelect(dt.name)}
                  />
                </Grid>
              ))}
            </Grid>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default DocumentTypeSelect;
