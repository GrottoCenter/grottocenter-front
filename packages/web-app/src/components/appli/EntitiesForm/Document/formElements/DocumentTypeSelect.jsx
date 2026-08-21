import { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
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

const docTypePropType = PropTypes.shape({
  id: PropTypes.number,
  name: PropTypes.string.isRequired,
  comment: PropTypes.string
});

const FeaturedCard = ({ docType, selected, onClick }) => {
  const { formatMessage } = useIntl();
  const Icon = DOCUMENT_TYPE_ICONS[docType.name] ?? DOCUMENT_TYPE_FALLBACK_ICON;

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
          transition: 'border-color 0.15s, background-color 0.15s',
          height: '100%'
        }}>
        <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
          <CardContent
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              py: 2,
              position: 'relative'
            }}>
            <Box
              sx={{
                color: selected ? 'primary.main' : 'text.secondary',
                display: 'flex',
                '& svg': { fontSize: 40 }
              }}>
              <Icon />
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
    </Tooltip>
  );
};

FeaturedCard.propTypes = {
  docType: docTypePropType.isRequired,
  selected: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired
};

const SecondaryCard = ({ docType, selected, onClick }) => {
  const { formatMessage } = useIntl();
  const Icon = DOCUMENT_TYPE_ICONS[docType.name] ?? DOCUMENT_TYPE_FALLBACK_ICON;

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
              py: 1.5,
              '&:last-child': {}
            }}>
            <Box
              sx={{
                color: selected ? 'primary.main' : 'text.secondary',
                display: 'flex',
                flexShrink: 0,
                mr: 0.5,
                '& svg': { fontSize: 20 }
              }}>
              <Icon />
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
  const { document, updateAttribute } = useContext(DocumentFormContext);
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { data: documentTypes = [], isPending } = useDocumentTypes();
  const [othersOpen, setOthersOpen] = useState(false);

  // Open others section if selected type is not featured
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
  const others = documentTypes.filter(dt => !FEATURED_TYPES.includes(dt.name));
  const selectedOther = others.find(dt => dt.name === document.type) ?? null;
  const SelectedOtherIcon = selectedOther
    ? (DOCUMENT_TYPE_ICONS[selectedOther.name] ?? DOCUMENT_TYPE_FALLBACK_ICON)
    : null;

  if (isPending) {
    return (
      <Box sx={{ mt: 1 }}>
        <Grid container spacing={1}>
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
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="subtitle2"
        component="p"
        sx={{ mb: 0.5, color: 'text.secondary' }}>
        {formatMessage({ id: 'Document type' })}
        <Box component="span" sx={{ color: 'error.main', ml: '4px' }}>
          *
        </Box>
      </Typography>
      <Grid container spacing={1} alignItems="stretch">
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
        <Box sx={{ mt: 1 }}>
          {isMobile && (
            <Box
              onClick={() => setOthersOpen(o => !o)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                border: '1px solid',
                borderColor: selectedOther ? 'primary.main' : 'divider',
                borderRadius: 1,
                px: 1,
                py: 0.5,
                bgcolor: selectedOther ? 'action.selected' : 'background.paper',
                '&:hover': {
                  borderColor: selectedOther
                    ? 'primary.main'
                    : 'text.secondary',
                  bgcolor: 'action.hover'
                },
                userSelect: 'none',
                mb: 0.5
              }}>
              {selectedOther && (
                <Box
                  sx={{
                    color: 'primary.main',
                    display: 'flex',
                    '& svg': { fontSize: 20 }
                  }}>
                  {SelectedOtherIcon && <SelectedOtherIcon />}
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
            </Box>
          )}

          <Collapse in={isMobile ? othersOpen : true}>
            <Grid container spacing={0.5}>
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
