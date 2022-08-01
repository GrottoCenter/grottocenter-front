import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isNil } from 'ramda';

import { useBoolean, usePermissions } from '../../../hooks';
import Layout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntrancesMap from './EntrancesMap';
import Provider, { CaveContext, caveTypes } from './Provider';
import Properties from './Properties';
import { NetworkForm } from '../EntitiesForm';
import StandardDialog from '../../common/StandardDialog';
import AuthorLink from '../../common/AuthorLink/index';

const Content = () => (
  <>
    <EntrancesMap />
    <Properties />
  </>
);

export const Network = ({ children }) => {
  const { formatMessage, formatDate } = useIntl();
  const {
    state: { cave, entrances }
  } = useContext(CaveContext);
  const { author, creationDate, name } = cave;
  const editPage = useBoolean();
  const permissions = usePermissions();

  const handleEdit = () => {
    editPage.open();
  };

  return (
    <Layout
      onEdit={permissions.isAuth ? handleEdit : undefined}
      fixedContent={
        <FixedContent
          title={name || ''}
          content={<Content />}
          footer={
            <span>
              <AuthorLink author={author} verb="Created" />
              {!isNil(creationDate) && ` (${formatDate(creationDate)})`}
            </span>
          }
          icon={<CustomIcon type="cave_system" />}
        />
      }>
      {children}
      {permissions.isAuth && (
        <StandardDialog
          fullWidth
          maxWidth="md"
          open={editPage.isOpen}
          onClose={editPage.close}
          scrollable
          title={formatMessage({ id: 'Network edition' })}>
          <NetworkForm
            networkValues={{
              ...cave,
              entrances,
              name: cave && cave.names ? cave.names[0].name : '',
              language: cave && cave.names ? cave.names[0].language : '',
              massif: cave?.massif || ''
            }}
          />
        </StandardDialog>
      )}
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
