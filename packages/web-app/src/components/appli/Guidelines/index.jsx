import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Typography,
  List,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import LinkIcon from '@mui/icons-material/Link';
import CreateIcon from '@mui/icons-material/Create';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { usePermissions, useNotification } from '../../../hooks';
import GuidelinePropTypes from '../../../types/guideline.type';
import GuidelineForm from '../EntitiesForm/Guideline/index';
import Guideline from './Guideline';
import { postGuideline } from '../../../actions/Guideline/CreateGuideline';
import { patchGuideline } from '../../../actions/Guideline/UpdateGuideline';
import { getGuidelinesUrl } from '../../../conf/apiRoutes';
import { checkAndGetStatus } from '../../../actions/utils';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { FormActionRow } from '../EntitiesForm/utils/FormContainers';
import Alert from '../../common/Alert';

const MODE_NONE = 'none';
const MODE_CREATE = 'create';
const MODE_ATTACH = 'attach';

const Guidelines = ({ entityType, entityId, guidelines }) => {
  const permissions = usePermissions();
  const { onError } = useNotification();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [mode, setMode] = useState(MODE_NONE);

  const [allGuidelines, setAllGuidelines] = useState([]);
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [attachFetchTrigger, setAttachFetchTrigger] = useState(0);

  const entityLabel = formatMessage({
    id:
      entityType === 'countries'
        ? 'country'
        : entityType === 'regions'
          ? 'region'
          : 'massif'
  });

  useEffect(() => {
    if (mode !== MODE_ATTACH) return;

    let cancelled = false;
    setIsLoadingGuidelines(true);

    fetch(getGuidelinesUrl)
      .then(checkAndGetStatus)
      .then(response => response.json())
      .then(data => {
        if (!cancelled) {
          setAllGuidelines(data || []);
          setIsLoadingGuidelines(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error(err);
          onError(
            formatMessage({
              id: 'guidelines.fetch_error',
              defaultMessage: 'Failed to load guidelines'
            })
          );
          setIsLoadingGuidelines(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mode, formatMessage, onError, attachFetchTrigger]);

  const closeForm = () => {
    setMode(MODE_NONE);
    setSelectedGuideline(null);
    setSearchValue('');
    setHasSearched(false);
  };

  const onSubmitCreateForm = async data => {
    const entities = { countries: [], regions: [], massifs: [] };
    if (entityType === 'countries') entities.countries = [entityId];
    else if (entityType === 'regions') entities.regions = [entityId];
    else if (entityType === 'massifs') entities.massifs = [entityId];

    const result = await dispatch(
      postGuideline({
        ...entities,
        title: data.title,
        description: data.description,
        language: data.language
      })
    );
    if (result) closeForm();
  };

  const handleAttachGuideline = async e => {
    if (e) e.preventDefault();
    if (!selectedGuideline) return;

    const countries = (selectedGuideline.countries || []).map(c => c.id || c);
    const regions = (selectedGuideline.regions || []).map(r => r.id || r);
    const massifs = (selectedGuideline.massifs || []).map(m => m.id || m);

    if (entityType === 'countries') {
      countries.push(entityId);
    } else if (entityType === 'regions') {
      regions.push(entityId);
    } else if (entityType === 'massifs') {
      massifs.push(entityId);
    }

    setIsSubmitting(true);
    const result = await dispatch(
      patchGuideline({
        id: selectedGuideline.id,
        countries,
        regions,
        massifs
      })
    );
    setIsSubmitting(false);
    if (result) closeForm();
  };

  const availableGuidelines = allGuidelines.filter(g => {
    if (entityType === 'countries') {
      return !g.countries?.some(c => String(c.id || c) === String(entityId));
    }
    if (entityType === 'regions') {
      return !g.regions?.some(r => String(r.id || r) === String(entityId));
    }
    if (entityType === 'massifs') {
      return !g.massifs?.some(m => String(m.id || m) === String(entityId));
    }
    return true;
  });

  if (!guidelines?.length && !permissions.isAuth) return null;

  const renderModeContent = () => {
    switch (mode) {
      case MODE_CREATE:
        return (
          <Box mb={1}>
            <ButtonGroup
              size="small"
              sx={{ mb: 1 }}
              data-testid="guideline-mode-toggle">
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => {
                  setMode(MODE_ATTACH);
                  setSelectedGuideline(null);
                  setAttachFetchTrigger(prev => prev + 1);
                }}>
                <FormattedMessage id="guidelines.attach_existing" />
              </Button>
              <Button variant="contained" startIcon={<CreateIcon />}>
                <FormattedMessage id="guidelines.create_new" />
              </Button>
            </ButtonGroup>
            <GuidelineForm
              isNew
              closeForm={closeForm}
              onSubmit={onSubmitCreateForm}
            />
          </Box>
        );

      case MODE_ATTACH:
        return (
          <Box mb={1}>
            <ButtonGroup
              size="small"
              sx={{ mb: 1 }}
              data-testid="guideline-mode-toggle">
              <Button variant="contained" startIcon={<LinkIcon />}>
                <FormattedMessage id="guidelines.attach_existing" />
              </Button>
              <Button
                variant="outlined"
                startIcon={<CreateIcon />}
                disabled={!hasSearched}
                onClick={() => {
                  setMode(MODE_CREATE);
                  setSelectedGuideline(null);
                }}>
                <FormattedMessage id="guidelines.create_new" />
              </Button>
            </ButtonGroup>
            <form autoComplete="off" onSubmit={handleAttachGuideline}>
              {isLoadingGuidelines ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    py: 2
                  }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Autocomplete
                  value={selectedGuideline}
                  inputValue={searchValue}
                  onInputChange={(event, newInputValue) => {
                    setSearchValue(newInputValue);
                    if (newInputValue.trim().length > 0) {
                      setHasSearched(true);
                    }
                  }}
                  onChange={(_event, newValue) =>
                    setSelectedGuideline(newValue)
                  }
                  options={availableGuidelines}
                  getOptionLabel={option => option.title || ''}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  filterOptions={(options, { inputValue }) => {
                    const term = inputValue.toLowerCase();
                    return options.filter(
                      o =>
                        (o.title || '').toLowerCase().includes(term) ||
                        (o.description || '').toLowerCase().includes(term)
                    );
                  }}
                  noOptionsText={formatMessage({
                    id: 'guidelines.no_results'
                  })}
                  renderOption={(props, option) => {
                    const { key, ...otherProps } = props;
                    return (
                      <li key={key} {...otherProps}>
                        <Box>
                          <Typography variant="body2">
                            {option.title}
                          </Typography>
                          {option.description && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}>
                              {option.description}
                            </Typography>
                          )}
                        </Box>
                      </li>
                    );
                  }}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={formatMessage({
                        id: 'guidelines.select_guideline'
                      })}
                      placeholder={formatMessage({
                        id: 'guidelines.search_placeholder'
                      })}
                      variant="filled"
                      data-testid="attach-guideline-autocomplete"
                    />
                  )}
                />
              )}

              <FormActionRow
                isCenter
                isSubmitting={isSubmitting}
                disabled={!selectedGuideline}
                onCancel={closeForm}
                submitLabel={formatMessage({ id: 'guidelines.btn_attach' })}
              />
            </form>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollableContent
      dense
      title={<FormattedMessage id="Guidelines" />}
      anchorId="guidelines"
      count={guidelines?.length ?? 0}
      defaultExpanded={guidelines?.length > 0}
      icon={
        permissions.isAuth &&
        mode === MODE_NONE && (
          <Button
            size="small"
            color="secondary"
            variant="outlined"
            onClick={() => {
              setMode(MODE_ATTACH);
              setAttachFetchTrigger(prev => prev + 1);
            }}
            startIcon={<LinkIcon />}
            data-testid="add-guideline-btn">
            <FormattedMessage
              id="guidelines.attach_existing"
              defaultMessage="Attach an existing guideline"
            />
          </Button>
        )
      }
      content={
        <>
          {renderModeContent()}
          {guidelines && guidelines.length > 0 ? (
            <List dense disablePadding>
              {guidelines.map(guideline => (
                <Guideline
                  key={guideline.id}
                  guideline={guideline}
                  isEditAllowed
                />
              ))}
            </List>
          ) : (
            mode === MODE_NONE && (
              <Alert
                severity="info"
                content={formatMessage(
                  { id: 'guidelines.none' },
                  { entityType: entityLabel }
                )}
              />
            )
          )}
        </>
      }
    />
  );
};

Guidelines.propTypes = {
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  guidelines: PropTypes.arrayOf(GuidelinePropTypes)
};

export default Guidelines;
