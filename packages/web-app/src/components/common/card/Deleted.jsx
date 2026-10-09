import { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { styled, useTheme } from '@mui/material/styles';
import {
  Button,
  Box,
  Card,
  Stack,
  IconButton,
  FormHelperText,
  Typography,
  CircularProgress
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/RestoreFromTrashRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForeverRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import useMediaQuery from '@mui/material/useMediaQuery';
import { getDeletedEntityRedirectUrl } from '@/utils/deletedEntityRedirect';
import { useDeletedEntityRedirectTarget } from '@/hooks/useDeletedEntityRedirectTarget';

import StandardDialog from '../StandardDialog';
import CustomIcon from '../CustomIcon';
import Alert from '../Alert';
import AppLink from '../AppLink';
import AuthorAndDate from '../Contribution/AuthorAndDate';
import Layout from '../Layouts/Fixed/FixedContent';
import { Property } from '../Properties';

import { nomelizeSearchEntity, EntityIcon } from '../../../helpers/Entity';
import { useDebounce, useQuickSearch } from '../../../hooks';
import AutoCompleteSearch from '../AutoCompleteSearch';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';

export const DELETED_ENTITIES = {
  entrance: {
    iconType: 'entrance',
    str: 'Entrance',
    url: '/ui/entrances/',
    searchType: ADVANCED_SEARCH_TYPES.ENTRANCES
  },
  massif: {
    iconType: 'massif',
    str: 'Massif',
    url: '/ui/massifs/',
    searchType: ADVANCED_SEARCH_TYPES.MASSIFS
  },
  organization: {
    iconType: 'organization',
    str: 'Organization',
    url: '/ui/organizations/',
    searchType: ADVANCED_SEARCH_TYPES.ORGANIZATIONS
  },
  document: {
    iconType: 'bibliography',
    str: 'Document',
    url: '/ui/documents/',
    searchType: ADVANCED_SEARCH_TYPES.DOCUMENTS
  },
  guideline: {
    iconType: 'guidelines',
    str: 'Guideline',
    url: '/ui/guidelines/'
  },
  network: {
    iconType: 'network',
    str: 'Network',
    url: '/ui/caves/',
    searchType: ADVANCED_SEARCH_TYPES.CAVES
  },
  person: {
    iconType: 'caver',
    str: 'Person',
    url: '/ui/persons/',
    searchType: 'persons'
  }
};

const isCurrentEntity = (candidate, entityId) =>
  candidate?.id != null &&
  entityId != null &&
  String(candidate.id) === String(entityId);

const StyledEntityIcon = styled(EntityIcon)`
  float: left;
`;

const RedirectTargetLoader = ({
  entityType,
  entityId,
  redirectId,
  onResolved
}) => {
  const query = useDeletedEntityRedirectTarget(entityType.str, redirectId);
  useEffect(() => {
    if (!query?.isPaused && (query?.isPending || query?.isFetching)) return;
    const target = query?.data;
    const isValid =
      !query?.error &&
      !query?.isPaused &&
      target?.id != null &&
      String(target.id) === String(redirectId) &&
      !isCurrentEntity(target, entityId) &&
      !target.isDeleted &&
      !target.redirectTo &&
      Boolean(entityType.str === 'Document' ? target.title : target.name);
    onResolved(
      isValid
        ? nomelizeSearchEntity({
            ...target,
            _type: entityType.searchType,
            type: target.type?.name ?? target.type
          })
        : null
    );
  }, [
    query?.data,
    query?.error,
    query?.isPending,
    query?.isFetching,
    query?.isPaused,
    entityType.searchType,
    entityType.str,
    entityId,
    redirectId,
    onResolved
  ]);
  return <CircularProgress size={24} />;
};

export const DeletedCard = ({
  entityType,
  entity,
  isLoading,
  onRestorePress,
  onPermanentDeletePress,
  standalone = true
}) => {
  const { formatMessage } = useIntl();
  const entityI18n = formatMessage({ id: entityType.str });
  const redirectToUrl = getDeletedEntityRedirectUrl(
    entityType,
    entity.redirectTo
  );

  const hasActions =
    !!redirectToUrl ||
    !!onRestorePress ||
    !!onPermanentDeletePress ||
    isLoading;

  const content = (
    <>
      <Alert
        disableMargins
        severity="warning"
        title={formatMessage(
          {
            id: 'deleted-card-intro-message',
            defaultMessage: 'This {entityFmt} has been deleted'
          },
          { entityFmt: entityI18n }
        )}
        content={
          <>
            {!!entity.location && (
              <Property
                label={formatMessage({ id: 'Location' })}
                value={entity.location}
              />
            )}
            <Box
              sx={{
                mt: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
              }}>
              <AuthorAndDate
                author={entity.author}
                date={entity.dateInscription}
              />
              {entity.reviewer && (
                <AuthorAndDate
                  author={entity.reviewer}
                  date={entity.dateReviewed}
                  verb="Deleted"
                />
              )}
            </Box>
          </>
        }
      />
      {hasActions && (
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{
            flexWrap: 'wrap',
            alignItems: 'center',
            mt: 2
          }}>
          {!!redirectToUrl && (
            <Button
              variant="outlined"
              color="primary"
              component={AppLink}
              nativeButton={false}
              to={redirectToUrl}
              startIcon={<ArrowForwardIcon />}>
              {formatMessage(
                {
                  id: 'deleted-card-go-to-related-btn',
                  defaultMessage: 'Go to the linked {entityFmt}'
                },
                { entityFmt: entityI18n }
              )}
            </Button>
          )}
          {isLoading && <CircularProgress size={28} />}
          {!!onRestorePress && !isLoading && (
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => onRestorePress()}
              startIcon={<RestoreIcon />}>
              {formatMessage({ id: 'Restore' })}
            </Button>
          )}
          {!!onPermanentDeletePress && !isLoading && (
            <Button
              color="error"
              onClick={() => onPermanentDeletePress()}
              startIcon={<DeleteForeverIcon />}>
              {formatMessage({ id: 'Permanently delete' })}
            </Button>
          )}
        </Stack>
      )}
    </>
  );

  if (!standalone) return content;

  return <Card sx={{ p: 2 }}>{content}</Card>;
};

export const Deleted = ({ entityType, entity }) => (
  <Layout
    title={entity.name}
    content={
      <DeletedCard entityType={entityType} entity={entity} standalone={false} />
    }
  />
);

const DeleteConfirmationDialogContent = ({
  entityType,
  entityId,
  entityName,
  entityIconType = entityType.iconType,
  isOpen,
  isLoading,
  isPermanent,
  existingRedirectId,
  onClose,
  onConfirmation,
  isSearchMandatory = false
}) => {
  const { formatMessage } = useIntl();
  const theme = useTheme();
  const isNarrowViewport = useMediaQuery(theme.breakpoints.down('sm'));
  const canSelectRedirect = Boolean(entityType.searchType);
  const [inputValue, setInputValue] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [hasEditedSelection, setHasEditedSelection] = useState(false);
  const [redirectStatus, setRedirectStatus] = useState('unresolved');
  const supportsPrefill = [
    'Document',
    'Entrance',
    'Network',
    'Massif',
    'Organization'
  ].includes(entityType.str);
  const shouldPrefill =
    isOpen &&
    isPermanent &&
    supportsPrefill &&
    existingRedirectId != null &&
    existingRedirectId !== '';
  const isResolvingRedirect =
    shouldPrefill && !hasEditedSelection && redirectStatus === 'unresolved';
  const hasRedirectError = redirectStatus === 'error';

  const debouncedInput = useDebounce(inputValue);
  const {
    data,
    error,
    isFetching: isQuickSearchLoading
  } = useQuickSearch({
    query: debouncedInput,
    entities: canSelectRedirect ? [entityType.searchType] : [],
    enabled: canSelectRedirect,
    // Preserve the legacy `debouncedInput.length > 2` threshold — the hook
    // defaults to AUTOCOMPLETE_MIN_CHARACTERS (2), which would fire one
    // character earlier than the pre-migration behavior of this dialog.
    minChars: 3
  });
  const suggestions = (data?.results ?? []).filter(
    suggestion => !isCurrentEntity(suggestion, entityId)
  );

  const handleSelection = selection => {
    if (isCurrentEntity(selection, entityId)) return;
    if (selection) {
      setHasEditedSelection(true);
      setRedirectStatus('resolved');
      setSelectedEntity(nomelizeSearchEntity(selection));
    }
    setInputValue('');
  };

  const entityFmt = formatMessage({ id: entityType.str });
  const entityValues = { entityFmt, entityKind: entityType.str };
  let actionButtonTitle = formatMessage({ id: 'Delete' });
  if (isPermanent) {
    actionButtonTitle =
      selectedEntity || isSearchMandatory
        ? formatMessage({ id: 'Merge and permanently delete' })
        : formatMessage({ id: 'Permanently delete' });
  }

  let searchTitle;
  if (!isPermanent) {
    searchTitle = formatMessage(
      {
        id: 'delete-confirmation-redirect',
        defaultMessage:
          'Optionally, select another {entityFmt} where visitors will be redirected to:'
      },
      entityValues
    );
  } else {
    searchTitle = isSearchMandatory
      ? formatMessage(
          {
            id: 'delete-permanent-merge-mandatory',
            defaultMessage:
              'Select another {entityFmt} where linked entities will be merged in:'
          },
          entityValues
        )
      : formatMessage(
          {
            id: 'delete-permanent-merge-optional',
            defaultMessage:
              'Optionally, select another {entityFmt} where linked entities will be merged in:'
          },
          entityValues
        );
  }

  let searchSectionId = 'delete-confirmation-redirect-label';
  if (isPermanent) {
    searchSectionId = isSearchMandatory
      ? 'delete-confirmation-merge-required-label'
      : 'delete-confirmation-merge-optional-label';
  }

  return (
    <StandardDialog
      fullScreen={isNarrowViewport}
      scrollable
      open={isOpen}
      onClose={onClose}
      title={
        <Typography variant="h3" component="span">
          {formatMessage(
            {
              id: isPermanent
                ? 'delete-permanent-confirmation-dialog'
                : 'delete-confirmation-dialog',
              defaultMessage: isPermanent
                ? 'Permanently delete this {entityFmt}?'
                : 'Delete this {entityFmt}?'
            },
            entityValues
          )}
        </Typography>
      }
      actions={
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            justifyContent: 'flex-end',
            gap: 1,
            width: '100%'
          }}>
          {isLoading && (
            <Box sx={{ margin: 1 }}>
              <CircularProgress />
            </Box>
          )}
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isLoading}
            sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
          {!isLoading && (
            <Button
              variant="contained"
              color="error"
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              startIcon={isPermanent ? <DeleteForeverIcon /> : <DeleteIcon />}
              disabled={
                isResolvingRedirect ||
                hasRedirectError ||
                (isSearchMandatory && !selectedEntity)
              }
              onClick={() => {
                onConfirmation(selectedEntity);
                onClose();
              }}>
              {actionButtonTitle}
            </Button>
          )}
        </Box>
      }>
      <Stack spacing={2}>
        {entityName && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              p: 1.5,
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              bgcolor: 'background.paper'
            }}>
            {entityIconType && (
              <Box aria-hidden="true" sx={{ flexShrink: 0 }}>
                <CustomIcon type={entityIconType} size={28} alt="" />
              </Box>
            )}
            <Typography
              variant="h5"
              component="p"
              sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>
              {entityName}
            </Typography>
          </Stack>
        )}
        <Typography>
          {formatMessage(
            {
              id: isPermanent
                ? 'delete-confirmation-permanent-effect'
                : 'delete-confirmation-soft-effect',
              defaultMessage: isPermanent
                ? 'This action is irreversible.'
                : 'This item will be marked as deleted. It can be restored.'
            },
            entityValues
          )}
        </Typography>
        {canSelectRedirect && (
          <Stack
            spacing={1}
            sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Typography variant="h5" component="p">
              {formatMessage({ id: searchSectionId })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTitle}
            </Typography>
            {isResolvingRedirect && (
              <RedirectTargetLoader
                entityType={entityType}
                entityId={entityId}
                redirectId={existingRedirectId}
                onResolved={target => {
                  setSelectedEntity(target);
                  setRedirectStatus(target ? 'resolved' : 'error');
                }}
              />
            )}
            {hasRedirectError && (
              <Stack spacing={1}>
                <FormHelperText error role="alert">
                  {formatMessage({
                    id: 'delete-confirmation-redirect-unavailable'
                  })}
                </FormHelperText>
                {!isSearchMandatory && (
                  <Button
                    onClick={() => {
                      setHasEditedSelection(true);
                      setRedirectStatus('resolved');
                    }}>
                    {formatMessage({ id: 'delete-confirmation-change-target' })}
                  </Button>
                )}
              </Stack>
            )}
            {shouldPrefill && selectedEntity && !hasEditedSelection && (
              <Typography variant="body2" color="text.secondary">
                {formatMessage({ id: 'delete-confirmation-existing-redirect' })}
              </Typography>
            )}
            {!selectedEntity && (
              <>
                <AutoCompleteSearch
                  onInputChange={value => {
                    if (value) {
                      // Abandoning hydration must not silently authorize
                      // deletion without the existing merge destination.
                      if (isResolvingRedirect) setRedirectStatus('error');
                      setHasEditedSelection(true);
                    }
                    setInputValue(value);
                  }}
                  onSelection={handleSelection}
                  hasError={!!error}
                  isLoading={isQuickSearchLoading}
                  label={formatMessage(
                    {
                      id: `Search for a {entityFmt}`,
                      defaultMessage: `Search for a {entityFmt}`
                    },
                    entityValues
                  )}
                  inputValue={inputValue}
                  suggestions={suggestions}
                />
                {!!error && (
                  <FormHelperText error role="alert">
                    {formatMessage({
                      id: 'Unable to search for a replacement. Please try again.'
                    })}
                  </FormHelperText>
                )}
              </>
            )}

            {selectedEntity && (
              <Box
                sx={{
                  p: 1,
                  bgcolor: 'background.paper',
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1
                }}>
                {selectedEntity.iconSrc && (
                  <StyledEntityIcon src={selectedEntity.iconSrc} />
                )}
                <IconButton
                  aria-label={formatMessage({ id: 'remove' })}
                  sx={{
                    float: 'right',
                    padding: selectedEntity?.subtitle ? 1 : 0.25
                  }}
                  onClick={() => {
                    setHasEditedSelection(true);
                    setSelectedEntity(null);
                  }}>
                  <CloseRoundedIcon />
                </IconButton>
                <Typography variant="subtitle1">
                  {selectedEntity.title}
                </Typography>
                <Typography variant="body2">
                  {selectedEntity.subtitle}
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </StandardDialog>
  );
};

DeletedCard.propTypes = {
  entityType: PropTypes.shape({
    str: PropTypes.string,
    iconType: PropTypes.string,
    url: PropTypes.string,
    searchType: PropTypes.string
  }),

  entity: PropTypes.shape({
    redirectTo: PropTypes.number,
    name: PropTypes.string,
    author: PropTypes.shape({
      id: PropTypes.number,
      nickname: PropTypes.string
    }),
    dateInscription: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.string
    ]),
    reviewer: PropTypes.shape({
      id: PropTypes.number,
      nickname: PropTypes.string
    }),
    dateReviewed: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.string
    ]),
    location: PropTypes.string
  }),

  isLoading: PropTypes.bool,
  onRestorePress: PropTypes.func,
  onPermanentDeletePress: PropTypes.func,
  standalone: PropTypes.bool
};

Deleted.propTypes = {
  entityType: DeletedCard.propTypes.entityType,
  entity: DeletedCard.propTypes.entity
};

export const DeleteConfirmationDialog = props => {
  const { isOpen, entityType, entityId, isPermanent } = props;
  if (!isOpen) return null;
  // A new opening/source/mode starts a new selection session. Late query
  // responses from a previous session cannot restore a discarded selection.
  return (
    <DeleteConfirmationDialogContent
      key={`${entityType.str}:${entityId}:${isPermanent}`}
      {...props}
    />
  );
};

DeleteConfirmationDialogContent.propTypes = {
  entityType: DeletedCard.propTypes.entityType.isRequired,
  entityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  entityName: PropTypes.string,
  entityIconType: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isPermanent: PropTypes.bool.isRequired,
  existingRedirectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClose: PropTypes.func.isRequired,
  onConfirmation: PropTypes.func.isRequired,
  isSearchMandatory: PropTypes.bool
};

DeleteConfirmationDialog.propTypes = DeleteConfirmationDialogContent.propTypes;

RedirectTargetLoader.propTypes = {
  entityType: DeletedCard.propTypes.entityType.isRequired,
  entityId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  redirectId: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
    .isRequired,
  onResolved: PropTypes.func.isRequired
};
