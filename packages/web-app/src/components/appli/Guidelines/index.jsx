import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, List, CircularProgress } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import LinkIcon from '@mui/icons-material/Link';
import { FormattedMessage, useIntl } from 'react-intl';
import NewEntityButton from '@/components/common/NewEntityButton';
import { EntityIcon } from '../../../pages/EntityCreation/entityConfig';
import {
  useGuidelines,
  usePatchGuideline,
  usePermissions,
  useNotification
} from '../../../hooks';
import GuidelinePropTypes from '../../../types/guideline.type';
import Guideline from './Guideline';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import SectionCreateButton from '../../common/SectionCreateButton';
import { FormActionRow } from '../EntitiesForm/utils/FormContainers';
import Alert from '../../common/Alert';

// Guidelines attach to a country, a region or a massif; massif is the default.
const ENTITY_LABEL_IDS = { countries: 'country', regions: 'region' };
const getScopeId = value => value?.iso ?? value?.id ?? value;

const Guidelines = ({ entityType, entityId, entityName, guidelines }) => {
  const permissions = usePermissions();
  const { onError } = useNotification();
  const { formatMessage } = useIntl();
  const patchMutation = usePatchGuideline();
  const [isGuidelineSearchVisible, setIsGuidelineSearchVisible] =
    useState(false);

  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const {
    data: guidelinesData,
    error: guidelinesError,
    isFetching: isLoadingGuidelines
  } = useGuidelines({ limit: 100, enabled: isGuidelineSearchVisible });
  const allGuidelines = guidelinesData?.guidelines ?? [];

  const entityLabel = formatMessage({
    id: ENTITY_LABEL_IDS[entityType] ?? 'massif'
  });

  useEffect(() => {
    if (!guidelinesError || !isGuidelineSearchVisible) return;
    onError(
      formatMessage({
        id: 'guidelines.fetch_error',
        defaultMessage: 'Failed to load guidelines'
      })
    );
  }, [guidelinesError, isGuidelineSearchVisible, formatMessage, onError]);

  const closeForm = () => {
    setIsGuidelineSearchVisible(false);
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

  const createParams = new URLSearchParams({
    scopeType: entityType,
    scopeId: String(entityId),
    scopeName: entityName
  });
  const createUrl = `/ui/entity/add/guideline?${createParams.toString()}`;

  return (
    <ScrollableContent
      dense
      title={<FormattedMessage id="Guidelines" />}
      subheader={
        <FormattedMessage id="Rules and recommendations applicable to this geographical entity and the caves it contains." />
      }
      anchorId="guidelines"
      count={guidelines?.length ?? 0}
      defaultExpanded={guidelines?.length > 0}
      icon={
        permissions.isAuth && (
          <Box display="flex" gap={0.5}>
            <SectionCreateButton
              isOpen={isGuidelineSearchVisible}
              onToggle={() => {
                if (isGuidelineSearchVisible) closeForm();
                else setIsGuidelineSearchVisible(true);
              }}
              label={formatMessage({ id: 'Associate' })}
              tooltip={formatMessage({ id: 'guidelines.attach_existing' })}
              icon={
                <EntityIcon
                  iconType="guidelines"
                  size={20}
                  BadgeIcon={LinkIcon}
                />
              }
              testId="add-guideline-btn"
            />
            <NewEntityButton
              to={createUrl}
              size="small"
              tooltip={formatMessage({ id: 'guidelines.create_new' })}
              icon={<EntityIcon iconType="guidelines" size={20} />}
            />
          </Box>
        )
      }
      content={
        <>
          {isGuidelineSearchVisible && (
            <Box mb={1}>
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
          )}
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
            !isGuidelineSearchVisible && (
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
  entityName: PropTypes.string.isRequired,
  guidelines: PropTypes.arrayOf(GuidelinePropTypes)
};

export default Guidelines;
