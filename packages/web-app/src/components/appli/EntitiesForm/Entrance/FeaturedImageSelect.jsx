import { useEffect, useId, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useController } from 'react-hook-form';
import { useIntl } from 'react-intl';
import {
  Box,
  Button,
  ButtonBase,
  IconButton,
  Radio,
  RadioGroup,
  Typography
} from '@mui/material';
import HideImageOutlined from '@mui/icons-material/HideImageOutlined';
import Visibility from '@mui/icons-material/Visibility';
import FileImage from '@/components/common/DocumentsList/FileImage';
import MediaLightbox from '@/components/common/DocumentsList/MediaLightbox';
import { getFeaturedImageCandidates } from '@/utils/mediaUtils';
import { DocumentChildPropTypes } from '@/types/document.type';
import { FormSection } from '../utils/FormContainers';

const imageStyles = {
  width: '100%',
  height: '100%',
  objectFit: 'contain'
};

const captionStyles = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  px: 1,
  pb: 0.5,
  pt: 2,
  textAlign: 'left',
  color: 'common.white',
  background: 'linear-gradient(transparent, rgba(0,0,0,0.75))'
};

const previewButtonStyles = {
  position: 'absolute',
  right: 4,
  top: 4,
  p: 1.25,
  bgcolor: 'background.paper',
  '&:hover': { bgcolor: 'grey.100' }
};

const FeaturedImageSelect = ({ control, documents = [] }) => {
  const { formatMessage } = useIntl();
  const { field } = useController({ control, name: 'entrance.featuredFile' });
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(null);
  const toggleRef = useRef(null);
  const emptyStateRef = useRef(null);
  const groupRef = useRef(null);
  const shouldRestoreFocus = useRef(false);
  const gridId = useId();
  const helpId = useId();
  const selectionId = useId();
  const candidates = useMemo(
    () => getFeaturedImageCandidates(documents),
    [documents]
  );
  const selectedIndex = candidates.findIndex(file => file.id === field.value);
  const selected = candidates[selectedIndex];
  const hasSavedImage = field.value != null;
  const noneLabel = formatMessage({ id: 'featuredImage.none' });
  const actionLabel = formatMessage({
    id: hasSavedImage ? 'Edit' : 'featuredImage.choose'
  });

  useEffect(() => {
    if (isExpanded) {
      const group = groupRef.current;
      const input =
        group?.querySelector('input:checked') ?? group?.querySelector('input');
      input?.focus();
    } else if (shouldRestoreFocus.current) {
      (toggleRef.current ?? emptyStateRef.current)?.focus();
      shouldRestoreFocus.current = false;
    }
  }, [isExpanded]);
  const getImageLabel = (file, index) =>
    [
      file.documentTitle,
      formatMessage(
        { id: 'Image {current} of {total}' },
        { current: index + 1, total: candidates.length }
      )
    ]
      .filter(Boolean)
      .join(' — ');

  const handleCollapse = () => {
    shouldRestoreFocus.current = true;
    setIsExpanded(false);
  };

  const handleChange = event => {
    field.onChange(
      event.target.value === '' ? null : Number(event.target.value)
    );
  };

  if (candidates.length === 0 && !hasSavedImage && !isExpanded) {
    return (
      <FormSection title="featuredImage.label">
        <Box data-testid="featured-image-select">
          <Typography
            ref={emptyStateRef}
            tabIndex={-1}
            variant="body2"
            color="text.secondary">
            {formatMessage({ id: 'featuredImage.empty' })}
          </Typography>
        </Box>
      </FormSection>
    );
  }

  return (
    <FormSection title="featuredImage.label">
      <Box data-testid="featured-image-select">
        <Typography
          id={helpId}
          variant="body2"
          color="text.secondary"
          sx={{ mb: 1.5 }}>
          {formatMessage({ id: 'featuredImage.help' })}
        </Typography>
        <Box
          hidden={isExpanded}
          sx={{
            position: 'relative',
            width: { xs: '100%', sm: 256 },
            maxWidth: '100%'
          }}>
          <ButtonBase
            ref={toggleRef}
            type="button"
            aria-label={actionLabel}
            aria-describedby={selected ? helpId : `${helpId} ${selectionId}`}
            aria-expanded={isExpanded}
            aria-controls={gridId}
            data-testid="featured-image-toggle"
            onClick={() => setIsExpanded(true)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              width: '100%',
              aspectRatio: { xs: '16 / 9', sm: '4 / 3' },
              overflow: 'hidden',
              bgcolor: 'grey.100',
              border: '2px solid',
              borderColor: selected ? 'primary.main' : 'divider',
              borderRadius: 1,
              color: 'text.secondary',
              transition: theme =>
                theme.transitions.create(['border-color', 'box-shadow']),
              '&:hover': {
                borderColor: 'primary.main',
                boxShadow: 1
              },
              '&:hover .featured-image-action, &.Mui-focusVisible .featured-image-action':
                { opacity: 1 },
              '&.Mui-focusVisible': {
                outline: '2px solid',
                outlineColor: 'primary.main',
                outlineOffset: 2
              }
            }}>
            {selected ? (
              <FileImage
                key={selected.id}
                file={selected}
                alt={getImageLabel(selected, selectedIndex)}
                sizes="(max-width: 599px) 100vw, 256px"
                sx={imageStyles}
              />
            ) : (
              <>
                <HideImageOutlined fontSize="large" />
                <Typography id={selectionId} variant="body2" sx={{ px: 1 }}>
                  {hasSavedImage
                    ? formatMessage({ id: 'featuredImage.unavailable' })
                    : noneLabel}
                </Typography>
              </>
            )}
            {selected?.documentTitle && (
              <Typography
                variant="caption"
                component="span"
                noWrap
                title={selected.documentTitle}
                sx={captionStyles}>
                {selected.documentTitle}
              </Typography>
            )}
            <Typography
              component="span"
              variant="body2"
              className="featured-image-action"
              aria-hidden="true"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                px: 1.5,
                py: 0.75,
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                opacity: 0,
                transition: theme => theme.transitions.create('opacity'),
                '@media (hover: none)': { opacity: 1 }
              }}>
              {actionLabel}
            </Typography>
          </ButtonBase>
        </Box>
        {isExpanded && (
          <Box
            id={gridId}
            data-testid="featured-image-options"
            sx={{
              p: { xs: 1, sm: 2 },
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.default'
            }}>
            <RadioGroup
              ref={groupRef}
              aria-label={formatMessage({ id: 'featuredImage.label' })}
              aria-describedby={helpId}
              name={field.name}
              value={field.value ?? ''}
              onChange={handleChange}
              onBlur={field.onBlur}
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  sm: 'repeat(auto-fill, 208px)'
                },
                gap: 1.5
              }}>
              {[null, ...candidates].map((file, index) => {
                const isSelected = (file?.id ?? null) === (field.value ?? null);
                const label = file ? getImageLabel(file, index - 1) : noneLabel;

                return (
                  <Box
                    key={file?.id ?? 'none'}
                    sx={{ minWidth: 0, position: 'relative' }}>
                    <Box
                      component="label"
                      sx={{
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        aspectRatio: '4 / 3',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        bgcolor: 'grey.100',
                        border: '2px solid',
                        borderRadius: 1,
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        '&:focus-within': {
                          outline: '2px solid',
                          outlineColor: 'primary.main',
                          outlineOffset: 2
                        }
                      }}>
                      {file ? (
                        <FileImage
                          file={file}
                          alt=""
                          sizes="(max-width: 599px) 45vw, 208px"
                          sx={imageStyles}
                        />
                      ) : (
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                            px: 1,
                            pt: 3,
                            color: 'text.secondary'
                          }}>
                          <HideImageOutlined />
                          <Typography variant="body2" align="center">
                            {noneLabel}
                          </Typography>
                        </Box>
                      )}
                      <Radio
                        value={file?.id ?? ''}
                        size="small"
                        slotProps={{
                          input: {
                            'aria-label': label,
                            ref: isSelected ? field.ref : undefined
                          }
                        }}
                        sx={{
                          position: 'absolute',
                          top: 4,
                          left: 4,
                          p: 0.5,
                          bgcolor: 'background.paper',
                          '&:hover': { bgcolor: 'background.paper' }
                        }}
                      />
                      {file?.documentTitle && (
                        <Typography
                          variant="caption"
                          component="div"
                          noWrap
                          title={file.documentTitle}
                          sx={captionStyles}>
                          {file.documentTitle}
                        </Typography>
                      )}
                    </Box>
                    {file && (
                      <IconButton
                        aria-label={formatMessage(
                          { id: 'featuredImage.preview' },
                          { name: label }
                        )}
                        onClick={() => setPreviewIndex(index - 1)}
                        sx={previewButtonStyles}>
                        <Visibility />
                      </IconButton>
                    )}
                  </Box>
                );
              })}
            </RadioGroup>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={handleCollapse}
                sx={{ width: { xs: '100%', sm: 'auto' } }}>
                {formatMessage({ id: 'Close' })}
              </Button>
            </Box>
          </Box>
        )}
        {previewIndex !== null && (
          <MediaLightbox
            open
            onClose={() => setPreviewIndex(null)}
            media={candidates}
            initialIndex={previewIndex}
          />
        )}
      </Box>
    </FormSection>
  );
};

FeaturedImageSelect.propTypes = {
  control: PropTypes.shape({}).isRequired,
  documents: PropTypes.arrayOf(DocumentChildPropTypes)
};

export default FeaturedImageSelect;
