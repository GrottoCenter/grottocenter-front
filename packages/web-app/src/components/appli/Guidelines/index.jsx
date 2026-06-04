import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Typography, List, Tabs, Tab, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { usePermissions } from '../../../hooks';
import GuidelinePropTypes from '../../../types/guideline.type';
import GuidelineForm from '../EntitiesForm/Guideline/index';
import Guideline from './Guideline';
import { postGuideline } from '../../../actions/Guideline/CreateGuideline';
import { patchGuideline } from '../../../actions/Guideline/UpdateGuideline';
import { getGuidelinesUrl } from '../../../conf/apiRoutes';
import ScrollableContent from '../../common/Layouts/Fixed/ScrollableContent';
import { FormContainer, FormRow } from '../EntitiesForm/utils/FormContainers';
import ActionButton from '../../common/ActionButton';

const Guidelines = ({ entityType, entityId, guidelines }) => {
  const permissions = usePermissions();
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = create, 1 = attach

  const [allGuidelines, setAllGuidelines] = useState([]);
  const [isLoadingGuidelines, setIsLoadingGuidelines] = useState(false);
  const [selectedGuidelineId, setSelectedGuidelineId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isFormVisible && activeTab === 1 && allGuidelines.length === 0) {
      setIsLoadingGuidelines(true);
      fetch(getGuidelinesUrl)
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
  }, [isFormVisible, activeTab, allGuidelines.length]);

  const onSubmitCreateForm = data => {
    const entities = { countries: [], regions: [], massifs: [] };
    if (entityType === 'countries') entities.countries = [entityId];
    else if (entityType === 'regions') entities.regions = [entityId];
    else if (entityType === 'massifs') entities.massifs = [entityId];

    dispatch(
      postGuideline({
        ...entities,
        title: data.title,
        description: data.description,
        language: data.language
      })
    );
    setIsFormVisible(false);
  };

  const handleAttachGuideline = async e => {
    if (e) e.preventDefault();
    if (!selectedGuidelineId) return;

    const guidelineToAttach = allGuidelines.find(g => String(g.id) === String(selectedGuidelineId));
    if (!guidelineToAttach) return;

    const countries = (guidelineToAttach.countries || []).map(c => c.id || c);
    const regions = (guidelineToAttach.regions || []).map(r => r.id || r);
    const massifs = (guidelineToAttach.massifs || []).map(m => m.id || m);

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
        id: guidelineToAttach.id,
        countries,
        regions,
        massifs
      })
    );
    setIsSubmitting(false);
    setIsFormVisible(false);
    setSelectedGuidelineId('');
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

  return (
    <ScrollableContent
      title={<FormattedMessage id="Guidelines" />}
      anchorId="guidelines"
      icon={
        permissions.isAuth &&
        !isFormVisible && (
          <Button
            size="small"
            color="primary"
            variant="outlined"
            onClick={() => {
              setIsFormVisible(true);
              setActiveTab(0);
            }}
            data-testid="add-guideline-btn"
          >
            <FormattedMessage id="guidelines.add" defaultMessage="Add a new guideline" />
          </Button>
        )
      }
    >
      <Box p={2}>
        {isFormVisible && (
          <Box mb={2}>
            <Tabs
              value={activeTab}
              onChange={(_e, val) => setActiveTab(val)}
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label={formatMessage({ id: 'guidelines.create_new' })} />
              <Tab label={formatMessage({ id: 'guidelines.attach_existing' })} />
            </Tabs>

            {activeTab === 0 ? (
              <GuidelineForm
                isNew={true}
                closeForm={() => setIsFormVisible(false)}
                onSubmit={onSubmitCreateForm}
              />
            ) : (
              <FormContainer sx={{ marginTop: 2 }}>
                <form autoComplete="off" onSubmit={handleAttachGuideline}>
                  <FormRow>
                    <FormControl variant="standard" fullWidth>
                      <InputLabel shrink>
                        <FormattedMessage id="guidelines.select_guideline" />
                      </InputLabel>
                      <Select
                        value={selectedGuidelineId}
                        onChange={e => setSelectedGuidelineId(e.target.value)}
                        disabled={isLoadingGuidelines || isSubmitting}
                      >
                        <MenuItem value="" disabled>
                          <i>
                            <FormattedMessage id={isLoadingGuidelines ? 'Loading ...' : 'guidelines.select_guideline'} />
                          </i>
                        </MenuItem>
                        {availableGuidelines.map(g => (
                          <MenuItem key={g.id} value={g.id}>
                            {g.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </FormRow>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mt: 2
                    }}
                  >
                    <Button variant="outlined" onClick={() => setIsFormVisible(false)} sx={{ m: 1 }}>
                      <FormattedMessage id="Cancel" />
                    </Button>
                    <ActionButton
                      label={formatMessage({ id: 'guidelines.btn_attach' })}
                      loading={isSubmitting}
                      disabled={!selectedGuidelineId}
                      color="primary"
                      style={{ margin: '8px' }}
                      type="submit"
                    />
                  </Box>
                </form>
              </FormContainer>
            )}
          </Box>
        )}
        {guidelines && guidelines.length > 0 ? (
          <List disablePadding>
            {guidelines.map(guideline => (
              <Guideline
                key={guideline.id}
                guideline={guideline}
                isEditAllowed={true}
              />
            ))}
          </List>
        ) : (
          !isFormVisible && (
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
  entityId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  guidelines: PropTypes.arrayOf(GuidelinePropTypes)
};

export default Guidelines;
