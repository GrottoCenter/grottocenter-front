import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Typography,
  List,
  ButtonGroup,
  CircularProgress,
  Paper
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import LinkIcon from '@mui/icons-material/Link';
import CreateIcon from '@mui/icons-material/Create';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { usePermissions } from '../../../hooks';
import GuidelinePropTypes from '../../../types/guideline.type';
import GuidelineForm from '../EntitiesForm/Guideline/index';
import Guideline from './Guideline';
import { postGuideline } from '../../../actions/Guideline/CreateGuideline';
import { patchGuideline } from '../../../actions/Guideline/UpdateGuideline';
import { getGuidelinesUrl } from '../../../conf/apiRoutes';
import { checkAuthStatus } from '../../../actions/utils';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import ActionButton from '../../common/ActionButton';

const MODE_NONE = 'none';
const MODE_CHOOSE = 'choose';
const MODE_CREATE = 'create';
const MODE_ATTACH = 'attach';

const ChoiceButton = ({ icon, label, description, onClick, testId }) => (
  <Paper
    variant="outlined"
    onClick={onClick}
    data-testid={testId}
    sx={{
      flex: 1,
      p: 2,
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 1,
      transition: 'all 0.15s ease',
      '&:hover': {
        borderColor: 'primary.main',
        bgcolor: 'action.hover'
      }
    }}
  >
    <Box
      sx={{
        p: 1,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {icon}
    </Box>
    <Typography variant="subtitle2" align="center">
      {label}
    </Typography>
    <Typography variant="caption" color="text.secondary" align="center">
      {description}
    </Typography>
  </Paper>
);

ChoiceButton.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  testId: PropTypes.string
};

const Guidelines = ({ entityType, entityId, guidelines }) => {
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [mode, setMode] = useState(MODE_NONE);

  const [allGuidelines, setAllGuidelines] = useState([]);
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
  const [selectedGuideline, setSelectedGuideline] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (mode === MODE_ATTACH) {
      setIsLoadingGuidelines(true);
      fetch(getGuidelinesUrl)
        .then(checkAuthStatus(dispatch))
        .then(response => response.json())
        .then(data => {
          setAllGuidelines(data || []);
          setIsLoadingGuidelines(false);
        })
        .catch(err => {
          console.error(err);
          setIsLoadingGuidelines(false);
        });
    }
  }, [mode, dispatch]);

  const closeForm = () => {
    setMode(MODE_NONE);
    setSelectedGuideline(null);
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

    const countries = (selectedGuideline.countries || []).map(
      c => c.id || c
    );
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
    await dispatch(
      patchGuideline({
        id: selectedGuideline.id,
        countries,
        regions,
        massifs
      })
    );
    setIsSubmitting(false);
    closeForm();
  };

  const availableGuidelines = allGuidelines.filter(g => {
    if (entityType === 'countries') {
      return !g.countries?.some(
        c => String(c.id || c) === String(entityId)
      );
    }
    if (entityType === 'regions') {
      return !g.regions?.some(
        r => String(r.id || r) === String(entityId)
      );
    }
    if (entityType === 'massifs') {
      return !g.massifs?.some(
        m => String(m.id || m) === String(entityId)
      );
    }
    return true;
  });

  if (!guidelines?.length && !permissions.isAuth) return null;

  const renderModeContent = () => {
    switch (mode) {
      case MODE_CHOOSE:
        return (
          <Box mb={2}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 2,
                flexDirection: { xs: 'column', sm: 'row' }
              }}
            >
              <ChoiceButton
                icon={<CreateIcon />}
                label={formatMessage({ id: 'guidelines.create_new' })}
                description={formatMessage({
                  id: 'guidelines.create_new_description'
                })}
                onClick={() => setMode(MODE_CREATE)}
                testId="choose-create-guideline"
              />
              <ChoiceButton
                icon={<LinkIcon />}
                label={formatMessage({
                  id: 'guidelines.attach_existing'
                })}
                description={formatMessage({
                  id: 'guidelines.attach_existing_description'
                })}
                onClick={() => setMode(MODE_ATTACH)}
                testId="choose-attach-guideline"
              />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button variant="text" onClick={closeForm}>
                <FormattedMessage id="Cancel" />
              </Button>
            </Box>
          </Box>
        );

      case MODE_CREATE:
        return (
          <Box mb={2}>
            <ButtonGroup
              size="small"
              sx={{ mb: 2 }}
              data-testid="guideline-mode-toggle"
            >
              <Button
                variant="contained"
                startIcon={<CreateIcon />}
              >
                <FormattedMessage id="guidelines.create_new" />
              </Button>
              <Button
                variant="outlined"
                startIcon={<LinkIcon />}
                onClick={() => {
                  setMode(MODE_ATTACH);
                  setSelectedGuideline(null);
                }}
              >
                <FormattedMessage id="guidelines.attach_existing" />
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
          <Box mb={2}>
            <ButtonGroup
              size="small"
              sx={{ mb: 2 }}
              data-testid="guideline-mode-toggle"
            >
              <Button
                variant="outlined"
                startIcon={<CreateIcon />}
                onClick={() => {
                  setMode(MODE_CREATE);
                  setSelectedGuideline(null);
                }}
              >
                <FormattedMessage id="guidelines.create_new" />
              </Button>
              <Button
                variant="contained"
                startIcon={<LinkIcon />}
              >
                <FormattedMessage id="guidelines.attach_existing" />
              </Button>
            </ButtonGroup>

            <form autoComplete="off" onSubmit={handleAttachGuideline}>
              {isLoadingGuidelines ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    py: 3
                  }}
                >
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Autocomplete
                  value={selectedGuideline}
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
                        (o.title || '')
                          .toLowerCase()
                          .includes(term) ||
                        (o.description || '')
                          .toLowerCase()
                          .includes(term)
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
                              }}
                            >
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

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 2
                }}
              >
                <Button
                  variant="outlined"
                  onClick={closeForm}
                  sx={{ m: 1 }}
                >
                  <FormattedMessage id="Cancel" />
                </Button>
                <ActionButton
                  label={formatMessage({
                    id: 'guidelines.btn_attach'
                  })}
                  loading={isSubmitting}
                  disabled={!selectedGuideline}
                  color="primary"
                  style={{ margin: '8px' }}
                  type="submit"
                />
              </Box>
            </form>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollableContent
      title={<FormattedMessage id="Guidelines" />}
      anchorId="guidelines"
      icon={
        permissions.isAuth &&
        mode === MODE_NONE && (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => setMode(MODE_CHOOSE)}
            startIcon={<AddIcon />}
            data-testid="add-guideline-btn"
          >
            <FormattedMessage
              id="guidelines.add"
              defaultMessage="Add a new guideline"
            />
          </Button>
        )
      }
    >
      <Box p={2}>
        {renderModeContent()}
        {guidelines && guidelines.length > 0 ? (
          <List disablePadding>
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
            <Typography variant="body2" color="textSecondary">
              <FormattedMessage
                id="guidelines.none"
                values={{ entityType }}
              />
            </Typography>
          )
        )}
      </Box>
    </ScrollableContent>
  );
};

Guidelines.propTypes = {
  entityType: PropTypes.string.isRequired,
  entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  guidelines: PropTypes.arrayOf(GuidelinePropTypes)
};

export default Guidelines;
