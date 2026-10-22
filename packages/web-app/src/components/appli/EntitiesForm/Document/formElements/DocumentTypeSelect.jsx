import { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Grid,
  Skeleton,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import {
  DocumentTypes,
  DOCUMENT_TYPE_ICONS,
  DOCUMENT_TYPE_FALLBACK_ICON,
  documentTypeHelpers
} from '../../../../../utils/documentTypeHelpers';
import { DocumentFormContext } from '../Provider';
import { useDocumentTypes } from '../../../../../hooks';

const { isArticle, isIssue } = documentTypeHelpers;

const FEATURED_TYPES = [
  DocumentTypes.IMAGE,
  DocumentTypes.TOPOGRAPHIC_DRAWING,
  DocumentTypes.REPORT
];

// Keep related choices together in the four-column desktop grid and in pairs
// on mobile. This order serves type selection, rather than document-list sorting.
const SECONDARY_TYPE_ORDER = new Map(
  [
    DocumentTypes.ARTICLE,
    DocumentTypes.BOOK,
    DocumentTypes.COLLECTION,
    DocumentTypes.ISSUE,

    DocumentTypes.TEXT,
    DocumentTypes.MAP,
    DocumentTypes.TOPOGRAPHIC_DATA,
    DocumentTypes.DATASET,

    DocumentTypes.MOVING_IMAGE,
    DocumentTypes.SOUND,
    DocumentTypes.INTERACTIVE_RESOURCE,
    DocumentTypes.SOFTWARE,

    DocumentTypes.PHYSICAL_OBJECT,
    DocumentTypes.EVENT,
    DocumentTypes.SERVICE,
    DocumentTypes.AUTHORIZATION_TO_PUBLISH
  ].map((type, index) => [type, index])
);

const docTypePropType = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string.isRequired,
  comment: PropTypes.string
});

const TYPE_DESCRIPTIONS = {
  [DocumentTypes.ARTICLE]: 'Journal article',
  [DocumentTypes.AUTHORIZATION_TO_PUBLISH]: 'Publishing permission and license',
  [DocumentTypes.BOOK]: '',
  [DocumentTypes.COLLECTION]: 'Collection of journals',
  [DocumentTypes.DATASET]: 'Measurements, surveys, tables…',
  [DocumentTypes.EVENT]: 'Conference, meeting…',
  [DocumentTypes.IMAGE]: 'Photo, sketch, diagram',
  [DocumentTypes.INTERACTIVE_RESOURCE]: '3D view, virtual tour',
  [DocumentTypes.ISSUE]: 'Journal or magazine issue',
  [DocumentTypes.MAP]: 'A geographical map',
  [DocumentTypes.MOVING_IMAGE]: 'Video, animation',
  [DocumentTypes.PHYSICAL_OBJECT]: 'Material object, sample',
  [DocumentTypes.REPORT]: 'Exploration, study, expedition',
  [DocumentTypes.SERVICE]: 'Web portal, online tool',
  [DocumentTypes.SOFTWARE]: 'Program, source code',
  [DocumentTypes.SOUND]: 'Recording, interview',
  [DocumentTypes.STILL_IMAGE]: 'Photo, sketch, diagram',
  [DocumentTypes.TEXT]: 'Notice, fact sheet, standalone document…',
  [DocumentTypes.TOPOGRAPHIC_DATA]: 'Survey measurements and files',
  [DocumentTypes.TOPOGRAPHIC_DRAWING]: 'Cave plan, cross-section'
};

const TypeLabel = ({ docType, isFeatured = false }) => {
  const { formatMessage } = useIntl();
  const descriptionId = TYPE_DESCRIPTIONS[docType.name] ?? docType.comment;

  return (
    <Box
      sx={{
        display: isFeatured ? 'contents' : 'block',
        minWidth: 0,
        flex: 1,
        textAlign: isFeatured ? 'center' : 'start'
      }}>
      <Typography
        data-testid="document-type-name"
        variant={isFeatured ? 'subtitle1' : 'body2'}
        component="span"
        sx={{
          typography: isFeatured ? { xs: 'body2', sm: 'subtitle1' } : undefined,
          color: 'text.primary',
          display: 'block',
          fontWeight: isFeatured ? { xs: 600, sm: 600 } : 600,
          overflowWrap: 'anywhere',
          alignSelf: 'start'
        }}>
        {formatMessage({ id: docType.name })}
      </Typography>
      {descriptionId && (
        <Typography
          data-testid="document-type-description"
          variant="caption"
          component="span"
          sx={{
            color: 'text.secondary',
            display: 'block',
            overflowWrap: 'anywhere',
            alignSelf: 'start'
          }}>
          {formatMessage({ id: descriptionId })}
        </Typography>
      )}
    </Box>
  );
};

TypeLabel.propTypes = {
  docType: docTypePropType.isRequired,
  isFeatured: PropTypes.bool
};

const TypeCard = ({ docType, selected, onClick, isFeatured = false }) => {
  const Icon = DOCUMENT_TYPE_ICONS[docType.name] ?? DOCUMENT_TYPE_FALLBACK_ICON;

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: selected ? 'primary.main' : 'divider',
        boxShadow: selected
          ? theme => `inset 0 0 0 1px ${theme.palette.primary.main}`
          : 'none',
        bgcolor: selected ? 'action.selected' : 'background.paper',
        transition: 'border-color 0.15s, background-color 0.15s',
        height: '100%'
      }}>
      <CardActionArea
        data-testid={`document-type-${docType.id}`}
        aria-pressed={selected}
        onClick={onClick}
        sx={{
          height: '100%',
          color: selected ? 'primary.main' : 'text.primary'
        }}>
        <CardContent
          sx={{
            display: isFeatured ? 'grid' : 'flex',
            gridTemplateRows: isFeatured ? 'auto 1fr auto' : undefined,
            justifyItems: isFeatured ? 'center' : undefined,
            textAlign: isFeatured ? 'center' : 'start',
            height: '100%',
            alignItems: 'flex-start',
            gap: isFeatured ? 0.5 : 1,
            p: 1,
            '&:last-child': { pb: 1 }
          }}>
          <Box
            data-testid="document-type-icon"
            sx={{
              color: selected ? 'primary.main' : 'text.secondary',
              display: 'flex',
              flexShrink: 0,
              '& svg': { fontSize: isFeatured ? 40 : 20 }
            }}>
            {selected && !isFeatured ? (
              <CheckCircleIcon data-testid="document-type-selected" />
            ) : (
              <Icon />
            )}
          </Box>
          <TypeLabel docType={docType} isFeatured={isFeatured} />
          {selected && isFeatured && (
            <CheckCircleIcon
              data-testid="document-type-selected"
              sx={{
                position: 'absolute',
                top: theme => theme.spacing(0.5),
                right: theme => theme.spacing(0.5),
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

TypeCard.propTypes = {
  docType: docTypePropType.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  isFeatured: PropTypes.bool
};

const DocumentTypeSelect = () => {
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: documentTypes = [], isPending } = useDocumentTypes();
  const [othersOpen, setOthersOpen] = useState(false);

  useEffect(() => {
    if (document.type !== -1 && !FEATURED_TYPES.includes(document.type)) {
      setOthersOpen(true);
    }
  }, [document.type]);

  const handleSelect = newDocType => {
    if (newDocType === document.type) return;
    updateAttribute('type', newDocType);
    if (!isArticle(newDocType) && !isIssue(newDocType)) {
      updateAttribute('parent', null);
    }
  };

  const featured = documentTypes.filter(dt => FEATURED_TYPES.includes(dt.name));
  const others = documentTypes
    .filter(dt => !FEATURED_TYPES.includes(dt.name))
    .sort(
      (a, b) =>
        (SECONDARY_TYPE_ORDER.get(a.name) ?? Number.MAX_SAFE_INTEGER) -
        (SECONDARY_TYPE_ORDER.get(b.name) ?? Number.MAX_SAFE_INTEGER)
    );

  if (isPending) {
    return (
      <Box sx={{ mt: 1 }}>
        <Grid container spacing={1}>
          {[0, 1, 2].map(i => (
            <Grid size={4} key={i}>
              <Skeleton variant="rounded" height={160} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="subtitle2"
        component="p"
        sx={{ mb: 0.5, color: 'text.secondary' }}>
        {formatMessage({ id: 'Document type' })}
        <Box component="span" sx={{ color: 'error.main', ml: 0.5 }}>
          *
        </Box>
      </Typography>
      <Grid
        container
        spacing={0.5}
        sx={{
          alignItems: 'stretch'
        }}>
        {featured.map(dt => (
          <Grid size={4} key={dt.id}>
            <TypeCard
              isFeatured
              docType={dt}
              selected={document.type === dt.name}
              onClick={() => handleSelect(dt.name)}
            />
          </Grid>
        ))}
      </Grid>
      {others.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {isMobile && (
            <Button
              variant="outlined"
              color="inherit"
              data-testid="document-other-types-toggle"
              aria-expanded={othersOpen}
              aria-controls="document-other-types"
              onClick={() => setOthersOpen(o => !o)}
              sx={{
                display: 'flex',
                width: '100%',
                textTransform: 'none',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: 'divider',
                color: 'text.primary',
                boxShadow: 'none',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                bgcolor: 'background.paper',
                '&:hover': {
                  borderColor: 'text.secondary',
                  bgcolor: 'action.hover'
                },
                userSelect: 'none',
                mb: 0.5
              }}>
              <Typography
                variant="body2"
                sx={{ color: 'text.primary', flex: 1, textAlign: 'start' }}>
                {formatMessage({ id: 'Other types' })}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  bgcolor: 'action.selected',
                  borderRadius: 10,
                  px: 0.5,
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
            </Button>
          )}

          <Collapse id="document-other-types" in={isMobile ? othersOpen : true}>
            <Grid container spacing={0.5}>
              {others.map(dt => (
                <Grid size={{ xs: 6, sm: 4, md: 3 }} key={dt.id}>
                  <TypeCard
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
