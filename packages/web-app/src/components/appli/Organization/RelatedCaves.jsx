import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import CavesList from '../../common/cave/CavesList';
import EntrancesList from '../../common/entrance/EntrancesList';
import Alert from '../../common/Alert';

import { EntrancePropTypes, NetworkPropTypes } from './propTypes';

const RelatedCaves = ({
  exploredEntrances,
  exploredNetworks,
  partnerEntrances,
  partnerNetworks
}) => {
  const { formatMessage } = useIntl();
  return (
    <>
      <EntrancesList
        entrances={exploredEntrances}
        title={formatMessage({ id: 'Explored entrances' })}
        emptyMessageComponent={
          <Alert
            severity="info"
            title={formatMessage({
              id: 'No explored entrances found.'
            })}
          />
        }
      />
      <br />
      <CavesList
        caves={exploredNetworks}
        title={formatMessage({ id: 'Explored networks' })}
        emptyMessageComponent={
          <Alert
            severity="info"
            title={formatMessage({
              id: 'No explored networks found.'
            })}
          />
        }
      />

      <hr />
      <EntrancesList
        entrances={partnerEntrances}
        title={formatMessage({ id: 'Partner entrances' })}
        emptyMessageComponent={
          <Alert
            severity="info"
            title={formatMessage({
              id: 'No partner entrances found.'
            })}
          />
        }
      />
      <br />
      <CavesList
        caves={partnerNetworks}
        title={formatMessage({ id: 'Partner networks' })}
        emptyMessageComponent={
          <Alert
            severity="info"
            title={formatMessage({
              id: 'No partner networks found.'
            })}
          />
        }
      />
    </>
  );
};

RelatedCaves.propTypes = {
  exploredEntrances: PropTypes.arrayOf(EntrancePropTypes),
  exploredNetworks: PropTypes.arrayOf(NetworkPropTypes),
  partnerEntrances: PropTypes.arrayOf(EntrancePropTypes),
  partnerNetworks: PropTypes.arrayOf(NetworkPropTypes)
};

export default RelatedCaves;
