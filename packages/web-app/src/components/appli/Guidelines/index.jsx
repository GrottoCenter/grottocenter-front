import { useState, useEffect } from 'react';
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
import AppLink from '@/components/common/AppLink';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import {
  usePatchGuideline,
  usePermissions,
  useNotification
} from '../../../hooks';
import GuidelinePropTypes from '../../../types/guideline.type';
import Guideline from './Guideline';
import { getGuidelinesUrl } from '../../../conf/apiRoutes';
import { checkAndGetStatus } from '../../../actions/utils';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import SectionCreateButton from '../../common/SectionCreateButton';
import { FormActionRow } from '../EntitiesForm/utils/FormContainers';
import Alert from '../../common/Alert';

const MODE_NONE = 'none';
const MODE_ATTACH = 'attach';

// Guidelines attach to a country, a region or a massif; massif is the default.
const ENTITY_LABEL_IDS = { countries: 'country', regions: 'region' };
const getScopeId = value => value?.iso ?? value?.id ?? value;

const Guidelines = ({ entityType, entityId, guidelines }) => {
  const permissions = usePermissions();
  const { onError } = useNotification();
  const { formatMessage } = useIntl();
  const patchMutation = usePatchGuideline();
  const [mode, setMode] = useState(MODE_NONE);

  const [allGuidelines, setAllGuidelines] = useState([]);
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [attachFetchTrigger, setAttachFetchTrigger] = useState(0);

  const entityLabel = formatMessage({
    id: ENTITY_LABEL_IDS[entityType] ?? 'massif'
  });

  useEffect(() => {
    if (mode !== MODE_ATTACH) return undefined;

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
  };

  const handleAttachGuideline = async e => {
    if (e) e.preventDefault();
    if (!selectedGuideline) return;

    const countries = (selectedGuideline.countries || []).map(getScopeId);
    const regions = (selectedGuideline.regions || []).map(getScopeId);
    const massifs = (selectedGuideline.massifs || []).map(getScopeId);

    if (entityType === 'countries') {
      countries.push(entityId);
    } else if (entityType === 'regions') {
      regions.push(entityId);
    } else if (entityType === 'massifs') {
      massifs.push(entityId);
    }

    setIsSubmitting(true);
    try {
      await patchMutation.mutateAsync({
        id: selectedGuideline.id,
        countries,
        regions,
        massifs
      });
      closeForm();
    } catch {
      /* toast handled globally */
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkGuideline = async guideline => {
    const scopes = {
      countries: (guideline.countries ?? []).map(getScopeId),
      regions: (guideline.regions ?? []).map(getScopeId),
      massifs: (guideline.massifs ?? []).map(getScopeId)
    };
    scopes[entityType] = scopes[entityType].filter(
      id => String(id) !== String(entityId)
    );

    await patchMutation.mutateAsync({ id: guideline.id, ...scopes });
  };

  const availableGuidelines = allGuidelines.filter(g => {
    if (entityType === 'countries') {
      return !g.countries?.some(
        country => String(getScopeId(country)) === String(entityId)
      );
    }
    if (entityType === 'regions') {
      return !g.regions?.some(
        region => String(getScopeId(region)) === String(entityId)
      );
    }
    if (entityType === 'massifs') {
      return !g.massifs?.some(
        massif => String(getScopeId(massif)) === String(entityId)
      );
    }
    return true;
  });

  if (!guidelines?.length && !permissions.isAuth) return null;

  const renderModeContent = () => {
    switch (mode) {
      case MODE_ATTACH:
        return (
          <Box mb={1}>
            <ButtonGroup
              size="small"
              sx={{ mb: 1 }}
              data-testid="guideline-mode-toggle">
              <Button variant="contained" startIcon={<LinkIcon />}>
                <FormattedMessage id="Associate" />
              </Button>
              <Button
                component={AppLink}
                to="/ui/entity/add/guideline"
                variant="outlined"
                startIcon={<CreateIcon />}>
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
                    // MUI hands `key` inside renderOption's props bag and React 19 requires
                    // extracting it before the spread; this callback is not a component.
                    // eslint-disable-next-line react/prop-types
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
        permissions.isAuth && (
          <SectionCreateButton
            isOpen={mode !== MODE_NONE}
            onToggle={() => {
              if (mode === MODE_NONE) {
                setMode(MODE_ATTACH);
                setAttachFetchTrigger(prev => prev + 1);
              } else {
                closeForm();
              }
            }}
            label={formatMessage({ id: 'Associate' })}
            icon={
              <EntityIcon
                iconType="guidelines"
                size={20}
                BadgeIcon={LinkIcon}
              />
            }
            testId="add-guideline-btn"
          />
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
                  onUnlink={
                    permissions.isAuth ? handleUnlinkGuideline : undefined
                  }
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
