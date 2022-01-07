import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'ramda';
import Skeleton from '@material-ui/lab/Skeleton';
import { useIntl } from 'react-intl';

import Layout from '../common/Layouts/Fixed/FixedContent';
import CavesList from '../common/cave/CavesList';
import EntrancesList from '../common/entrance/EntrancesList';
import Translate from '../common/Translate';

const Massif = ({ isFetching, massif }) => {
  const { formatMessage } = useIntl();

  if (isNil(massif) && !isFetching) {
    return (
      <Translate>
        Error, the massif data you are looking for is not available.
      </Translate>
    );
  }

  return (
    <Layout
      title={massif?.name || formatMessage({ id: 'Loading massif data...' })}
      content={
        isFetching ? (
          <Skeleton height={200} />
        ) : (
          <>
            <EntrancesList
              entrances={massif.entrances}
              emptyMessageComponent={formatMessage({
                id: 'This massif has no entrances listed yet.'
              })}
              title={formatMessage({ id: 'Entrances list' })}
            />
            <CavesList
              caves={massif.networks}
              emptyMessageComponent={formatMessage({
                id: 'This massif has no networks listed yet.'
              })}
              title={formatMessage({ id: 'Networks list' })}
            />
          </>
        )
      }
    />
  );
};

Massif.propTypes = {
  isFetching: PropTypes.bool.isRequired,
  massif: PropTypes.shape({
    name: PropTypes.string,
    entrances: PropTypes.arrayOf(PropTypes.shape({})),
    networks: PropTypes.arrayOf(PropTypes.shape({}))
  })
};
Massif.defaultProps = {
  massif: undefined
};

export default Massif;
