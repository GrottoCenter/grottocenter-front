import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { Divider } from '@mui/material';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import {
  fetchAdvancedSearchResults,
  resetAdvancedSearchResults
} from '../../../actions/Advancedsearch';
import { getStoredRowsPerPage } from '../../common/EntityTable/EntityTable';
import SearchResults from './SearchResults';

const ENTITY_ICON_TYPE = {
  entrances: 'entrance',
  documents: 'bibliography',
  massifs: 'massif',
  organizations: 'organization',
  persons: 'caver'
};

const EntitySearchPage = ({ title, subheader, actions, entityType, children }) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const iconType = ENTITY_ICON_TYPE[entityType] ?? 'entrance';
  useEffect(() => {
    dispatch(resetAdvancedSearchResults());
    dispatch(
      fetchAdvancedSearchResults({
        entity: entityType,
        query: '',
        matchAllFields: true,
        size: getStoredRowsPerPage()
      })
    );
  }, [dispatch, entityType]);

  return (
    <FixedContent
      icon={<CustomIcon type={iconType} />}
      title={formatMessage({ id: title })}
      subheader={subheader}
      action={actions}
      content={
        <>
          {children}
          <Divider sx={{ my: 2 }} />
          <SearchResults entityType={entityType} />
        </>
      }
    />
  );
};

EntitySearchPage.propTypes = {
  title: PropTypes.string.isRequired,
  subheader: PropTypes.node,
  actions: PropTypes.node,
  entityType: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired
};

export default EntitySearchPage;
