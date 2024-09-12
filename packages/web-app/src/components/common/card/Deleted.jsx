import React, { useState, useCallback, useEffect } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  Tooltip,
  Box,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import RestoreIcon from '@mui/icons-material/RestoreFromTrashRounded';
import DeleteForeverIcon from '@mui/icons-material/RemoveCircleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import StandardDialog from '../StandardDialog';
import Alert from '../Alert';
import AuthorAndDate from '../Contribution/AuthorAndDate';
import Layout from '../Layouts/Fixed/FixedContent';
import { Property } from '../Properties';

import {
  entityOptionForSelector,
  nomelizeSearchEntity,
  EntityIcon
} from '../../../helpers/Entity';
import { useDebounce } from '../../../hooks';
import AutoCompleteSearch from '../AutoCompleteSearch';
import {
  fetchQuicksearchResult,
  resetQuicksearch
} from '../../../actions/Quicksearch';
import { ADVANCED_SEARCH_TYPES } from '../../../conf/config';

export const DELETED_ENTITIES = {
  entrance: {
    str: 'Entrance',
    url: '/ui/entrances/',
    searchType: ADVANCED_SEARCH_TYPES.ENTRANCES
  },
  massif: {
    str: 'Massif',
    url: '/ui/massifs/',
    searchType: ADVANCED_SEARCH_TYPES.MASSIFS
  },
  organization: {
    str: 'Organization',
    url: '/ui/organizations/',
    searchType: ADVANCED_SEARCH_TYPES.ORGANIZATIONS
  },
  document: {
    str: 'Document',
    url: '/ui/documents/',
    searchType: ADVANCED_SEARCH_TYPES.DOCUMENTS
  },
  network: {
    str: 'Network',
    url: '/ui/networks/',
    searchType: ADVANCED_SEARCH_TYPES.CAVES
  }
};

const StyledAuthor = styled('div')`
  display: inline-grid;
  padding-top: ${({ theme }) => theme.spacing(3)};
  padding-left: ${({ theme }) => theme.spacing(1)};
`;

const StyledEntityIcon = styled(EntityIcon)`
  float: left;
`;

export const Deleted = ({ entityType, entity }) => (
  <Layout
    title={entity.name}
    content={
      <DeletedCard
        entityType={entityType}
        entity={entity}
        includeSeparator={false}
      />
    }
  />
);

export const DeletedCard = ({
  entityType,
  entity,
  isLoading,
  onRestorePress,
  onPermanentDeletePress,
  includeSeparator = true
}) => {
  const { formatMessage } = useIntl();
  const entityI18n = formatMessage({ id: entityType.str });
  const redirectToUrl = entity.redirectTo
    ? entityType.url + entity.redirectTo
    : null;
  return (
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
            <StyledAuthor>
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
            </StyledAuthor>
          </>
        }
      />
      <Box variant="outlined" sx={{ marginTop: 3 }}>
        {!!redirectToUrl && (
          <Button variant="contained" color="secondary" href={redirectToUrl}>
            {formatMessage(
              {
                id: 'deleted-card-go-to-related-btn',
                defaultMessage: 'Go to the linked {entityFmt}'
              },
              { entityFmt: entityI18n }
            )}
          </Button>
        )}
        {isLoading && (
          <Box sx={{ margin: 2 }}>
            <CircularProgress />
          </Box>
        )}

        {!!onRestorePress && !isLoading && (
          <Tooltip title={formatMessage({ id: 'Restore' })}>
            <Button
              variant="outlined"
              sx={{ marginLeft: 3 }}
              onClick={() => onRestorePress()}
              color="primary"
              aria-label="restore">
              <RestoreIcon />
            </Button>
          </Tooltip>
        )}

        {!!onPermanentDeletePress && !isLoading && (
          <Tooltip title={formatMessage({ id: 'Permanently delete' })}>
            <Button
              variant="outlined"
              sx={{ marginLeft: 3 }}
              onClick={() => onPermanentDeletePress()}
              color="primary"
              aria-label="delete">
              <DeleteForeverIcon color="error" />
            </Button>
          </Tooltip>
        )}
      </Box>
      {includeSeparator && <hr />}
    </>
  );
};

export const DeleteConfirmationDialog = ({
  entityType,
  isOpen,
  isLoading,
  isPermanent,
  onClose,
  onConfirmation,
  hasSearch = true,
  isSearchMandatory = false
}) => {
  const { formatMessage } = useIntl();
  const dispatch = useDispatch();
  const [inputValue, setInputValue] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);
  const debouncedInput = useDebounce(inputValue);
  const {
    isLoading: isQuickSearckLoading,
    results: suggestions,
    error
  } = useSelector(state => state.quicksearch);

  useEffect(() => {
    if (!isOpen) setSelectedEntity(null);
  }, [isOpen, setSelectedEntity]);

  const fetchSearchResults = useCallback(
    query => {
      const criterias = {
        query: query.trim(),
        complete: false,
        resourceType: entityType.searchType
      };
      dispatch(fetchQuicksearchResult(criterias));
    },
    [dispatch, entityType]
  );

  const resetSearchResults = useCallback(() => {
    dispatch(resetQuicksearch());
  }, [dispatch]);

  useEffect(() => {
    if (debouncedInput.length > 2) {
      fetchSearchResults(debouncedInput);
    } else {
      resetSearchResults();
    }
  }, [debouncedInput, fetchSearchResults, resetSearchResults]);

  const handleSelection = selection => {
    if (selection) {
      setSelectedEntity(nomelizeSearchEntity(selection));
    }
    setInputValue('');
  };

  const entityFmt = formatMessage({ id: entityType.str });
  let actionButtonTitle = formatMessage({ id: 'Delete' });
  if (isPermanent) {
    actionButtonTitle =
      selectedEntity || isSearchMandatory
        ? formatMessage({ id: 'Merge and permanently delete' })
        : formatMessage({ id: 'Permanently delete' });
  }

  let searchTitle = '';
  if (!isPermanent) {
    searchTitle = formatMessage(
      {
        id: 'delete-confirmation-redirect',
        defaultMessage:
          'Optionally, select another {entityFmt} where visitors will be redirected to:'
      },
      { entityFmt }
    );
  } else {
    searchTitle = isSearchMandatory
      ? formatMessage(
          {
            id: 'delete-permanent-merge',
            defaultMessage:
              'Select another {entityFmt} where linked entities will be merged in:'
          },
          { entityFmt }
        )
      : formatMessage(
          {
            id: 'delete-permanent-merge',
            defaultMessage:
              'Optionally, select another {entityFmt} where linked entities will be merged in:'
          },
          { entityFmt }
        );
  }

  return (
    <StandardDialog
      open={isOpen}
      onClose={onClose}
      title={formatMessage({ id: 'Deletion confirmation' })}
      actions={
        <>
          {isLoading && (
            <Box sx={{ margin: 2 }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <Button
              disabled={isSearchMandatory && !selectedEntity}
              onClick={() => {
                onConfirmation(selectedEntity);
                onClose();
              }}>
              {actionButtonTitle}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {formatMessage({ id: 'Cancel' })}
          </Button>
        </>
      }>
      <Box>
        <Typography>
          {isPermanent
            ? formatMessage(
                {
                  id: 'delete-permanent-confirmation-dialog',
                  defaultMessage:
                    'Are you sure you want to permanently delete this {entityFmt} ?'
                },
                { entityFmt }
              )
            : formatMessage(
                {
                  id: 'delete-confirmation-dialog',
                  defaultMessage:
                    'Are you sure you want to delete this {entityFmt} ?'
                },
                { entityFmt }
              )}
        </Typography>
        {hasSearch && (
          <>
            <br />
            <br />
            <Typography>{searchTitle}</Typography>
          </>
        )}
        {hasSearch && !selectedEntity && (
          <AutoCompleteSearch
            onInputChange={setInputValue}
            onSelection={handleSelection}
            getOptionLabel={e => e?.name}
            hasError={!!error}
            isLoading={isQuickSearckLoading}
            label={formatMessage(
              {
                id: `Search for a {entityFmt}`,
                defaultMessage: `Search for a {entityFmt}`
              },
              { entityFmt }
            )}
            renderOption={entityOptionForSelector}
            inputValue={inputValue}
            suggestions={suggestions}
          />
        )}

        {selectedEntity && (
          <Box sx={{ padding: 2, background: 'white' }}>
            {selectedEntity.iconName && (
              <StyledEntityIcon src={`/images/${selectedEntity.iconName}`} />
            )}
            <IconButton
              aria-label="remove"
              sx={{
                float: 'right',
                padding: selectedEntity?.subtitle ? 2 : 0
              }}
              onClick={() => {
                setSelectedEntity(null);
              }}>
              <CloseRoundedIcon />
            </IconButton>
            <Typography variant="subtitle1">{selectedEntity.title}</Typography>
            <Typography variant="body2">{selectedEntity.subtitle}</Typography>
          </Box>
        )}
      </Box>
    </StandardDialog>
  );
};

DeletedCard.propTypes = {
  entityType: PropTypes.shape({
    str: PropTypes.string,
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
  includeSeparator: PropTypes.bool
};

Deleted.propTypes = {
  entityType: DeletedCard.propTypes.entityType,
  entity: DeletedCard.propTypes.entity
};

DeleteConfirmationDialog.propTypes = {
  entityType: DeletedCard.propTypes.entityType.isRequired,
  isOpen: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isPermanent: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirmation: PropTypes.func.isRequired,
  hasSearch: PropTypes.bool,
  isSearchMandatory: PropTypes.bool
};
