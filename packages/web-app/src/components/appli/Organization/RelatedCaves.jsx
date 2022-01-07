import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import CavesList from '../../common/cave/CavesList';
import EntrancesList from '../../common/entrance/EntrancesList';
import Translate from '../../common/Translate';

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
          <Translate>No explored entrances found.</Translate>
        }
      />
      <br />
      <CavesList
        caves={exploredNetworks}
        title={formatMessage({ id: 'Explored networks' })}
        emptyMessageComponent={
          <Translate>No explored networks found.</Translate>
        }
      />

      <hr />
      <EntrancesList
        entrances={partnerEntrances}
        title={formatMessage({ id: 'Partner entrances' })}
        emptyMessageComponent={
          <Translate>No partner entrances found.</Translate>
        }
      />
      <br />
      <CavesList
        caves={partnerNetworks}
        title={formatMessage({ id: 'Partner networks' })}
        emptyMessageComponent={
          <Translate>No partner networks found.</Translate>
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
