import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import CavesList from '../../common/cave/CavesList';
import EntrancesList from '../../common/entrance/EntrancesList';
import Alert from '../../common/Alert';

import { EntrancePropTypes, NetworkPropTypes } from './propTypes';

const RelatedCaves = ({ exploredEntrances, exploredNetworks }) => {
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
    </>
  );
};

RelatedCaves.propTypes = {
  exploredEntrances: PropTypes.arrayOf(EntrancePropTypes),
  exploredNetworks: PropTypes.arrayOf(NetworkPropTypes)
};

export default RelatedCaves;
