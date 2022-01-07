import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';

import CavesList from '../../common/cave/CavesList';
import EntrancesList from '../../common/entrance/EntrancesList';
import Translate from '../../common/Translate';

import { EntrancePropTypes, NetworkPropTypes } from './propTypes';

const RelatedCaves = ({
  exploredEntrances,
  exploredNetworks,
  partneredEntrances,
  partneredNetworks
}) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <EntrancesList
        entrances={exploredEntrances}
        title={
          <Typography variant="h3">
            {formatMessage({ id: 'Explored entrances' })}
          </Typography>
        }
        emptyMessageComponent={
          <Translate>No explored entrances found.</Translate>
        }
      />
      <br />
      <CavesList
        caves={exploredNetworks}
        title={
          <Typography variant="h3">
            {formatMessage({ id: 'Explored networks' })}
          </Typography>
        }
        emptyMessageComponent={
          <Translate>No explored networks found.</Translate>
        }
      />

      <hr />
      <EntrancesList
        entrances={partneredEntrances}
        title={
          <Typography variant="h3">
            {formatMessage({ id: 'Partnered entrances' })}
          </Typography>
        }
        emptyMessageComponent={
          <Translate>No partnered entrances found.</Translate>
        }
      />
      <br />
      <CavesList
        caves={partneredNetworks}
        title={
          <Typography variant="h3">
            {formatMessage({ id: 'Partnered networks' })}
          </Typography>
        }
        emptyMessageComponent={
          <Translate>No partnered networks found.</Translate>
        }
      />
    </>
  );
};

RelatedCaves.propTypes = {
  exploredEntrances: PropTypes.arrayOf(EntrancePropTypes),
  exploredNetworks: PropTypes.arrayOf(NetworkPropTypes),
  partneredEntrances: PropTypes.arrayOf(EntrancePropTypes),
  partneredNetworks: PropTypes.arrayOf(NetworkPropTypes)
};

export default RelatedCaves;
