import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';

import Layout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntrancesMap from './EntrancesMap';
import Provider, { CaveContext, caveTypes } from './Provider';
import Properties from './Properties';

const Content = () => (
  <>
    <EntrancesMap />
    <Properties />
  </>
);

export const Network = ({ children }) => {
  const { formatMessage, formatDate } = useIntl();
  const {
    state: {
      cave: { author, creationDate, name }
    }
  } = useContext(CaveContext);

  const footer = `${formatMessage({ id: 'Created by' })} ${author.fullName} ${
    !isNil(creationDate) ? `(${formatDate(creationDate)})` : ''
  }`;

  return (
    <Layout
      fixedContent={
        <FixedContent
          title={name || ''}
          content={<Content />}
          footer={footer}
          icon={<CustomIcon type="cave_system" />}
        />
      }>
      {children}
    </Layout>
  );
};

const HydratedNetwork = ({ children, ...props }) => (
  <Provider {...props}>
    <Network>{children}</Network>
  </Provider>
);

Network.propTypes = {
  children: PropTypes.node.isRequired
};

HydratedNetwork.propTypes = {
  data: caveTypes.isRequired,
  loading: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default HydratedNetwork;
