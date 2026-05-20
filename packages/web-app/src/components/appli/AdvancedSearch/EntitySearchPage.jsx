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
import { getStoredRowsPerPage } from '../../common/EntityTable';
import SearchResults from './SearchResults';

const ENTITY_ICON_TYPE = {
  entrances: 'entrance',
  documents: 'bibliography',
  massifs: 'massif',
  organizations: 'organization',
  persons: 'caver'
};

const EntitySearchPage = ({
  title,
  icon,
  subheader,
  actions,
  entityType,
  children,
  initialFilter = {}
}) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const iconType = ENTITY_ICON_TYPE[entityType] ?? 'entrance';
  useEffect(() => {
    dispatch(resetAdvancedSearchResults());
    dispatch(
      fetchAdvancedSearchResults({
        entity: entityType,
        query: '',
        filter: initialFilter,
        matchAllFields: true,
        size: getStoredRowsPerPage()
      })
    );
    // initialFilter is intentionally excluded: it's fixed at mount time.
    // Consumers must use key={searchKey} to force remounting when the filter changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, entityType]);

  const resolvedTitle =
    typeof title === 'string' ? formatMessage({ id: title }) : title;

  return (
    <FixedContent
      icon={icon ?? <CustomIcon type={iconType} />}
      title={resolvedTitle}
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
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  icon: PropTypes.node,
  subheader: PropTypes.node,
  actions: PropTypes.node,
  entityType: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  initialFilter: PropTypes.shape({})
};

export default EntitySearchPage;
