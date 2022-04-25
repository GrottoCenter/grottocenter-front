import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { isEmpty, isNil, propOr } from 'ramda';

import Provider, {
  commentsType,
  detailsType,
  EntryContext,
  descriptionsType,
  documentsType,
  historiesType,
  locationsType,
  riggingsType
} from './Provider';
import Layout from '../../common/Layouts/Fixed';
import FixedContent from '../../common/Layouts/Fixed/FixedContent';
import CustomIcon from '../../common/CustomIcon';
import EntryMap from './EntryMap';
import Properties from './Properties';
import Descriptions from './Descriptions';
import Locations from './Locations';
import Riggings from './Riggings';
import Comments from './Comments';
import Documents from './Documents';
import Histories from './Histories';
import { useBoolean, usePermissions } from '../../../hooks';
import StandardDialog from '../../common/StandardDialog';
import { EntranceForm } from '../EntitiesForm';

const EntryProperties = () => (
  <>
    <EntryMap />
    <Properties />
  </>
);

export const Entry = () => {
  const { formatMessage, formatDate } = useIntl();
  const {
    state: {
      details: {
        author,
        cave,
        country,
        creationDate,
        depth,
        development,
        editionDate,
        id,
        language,
        lastEditor,
        name,
        temperature
      },
      position,
      descriptions,
      documents,
      histories,
      locations,
      riggings,
      comments
    }
  } = useContext(EntryContext);
  const permissions = usePermissions();
  const editPage = useBoolean();

  const footer = `${formatMessage({ id: 'Created by' })}
        ${author.fullName} ${
    !isNil(creationDate) ? `(${formatDate(creationDate)})` : ''
  }
        ${
          !isNil(lastEditor) && !isNil(editionDate)
            ? ` - ${formatMessage({
                id: 'Last modification by'
              })} ${lastEditor} (
          ${formatDate(editionDate)})`
            : ''
        }`;

  const handleEdit = () => {
    editPage.open();
  };

  return (
    <Layout
      onEdit={permissions.isAuth ? handleEdit : undefined}
      fixedContent={
        <FixedContent
          title={name || ''}
          content={<EntryProperties />}
          footer={footer}
          icon={<CustomIcon type="entry" />}
        />
      }>
      <Locations locations={locations} entranceId={id} />
      {!isEmpty(descriptions) && <Descriptions descriptions={descriptions} />}
      {!isEmpty(riggings) && <Riggings riggings={riggings} />}
      {!isEmpty(documents) && <Documents documents={documents} />}
      {!isEmpty(histories) && <Histories histories={histories} />}
      {!isEmpty(comments) && <Comments comments={comments} />}
      {permissions.isAuth && (
        <StandardDialog
          fullWidth
          maxWidth="md"
          open={editPage.isOpen}
          onClose={editPage.close}
          scrollable
          title={formatMessage({ id: 'Entrance edition' })}>
          <EntranceForm
            entranceValues={{
              country,
              depth,
              id,
              name,
              language,
              latitude: propOr(undefined, 0, position),
              length: development,
              longitude: propOr(undefined, 1, position)
            }}
            caveValues={{
              ...cave,
              name: cave && cave.names ? cave.names[0].name : undefined,
              language: cave && cave.names ? cave.names[0].language : undefined,
              massif: cave && cave.massif ? cave.massif.id : undefined,
              temperature
            }}
          />
        </StandardDialog>
      )}
    </Layout>
  );
};

const HydratedEntry = ({ ...props }) => (
  <Provider {...props}>
    <Entry />
  </Provider>
);

Entry.propTypes = {};

HydratedEntry.propTypes = {
  details: detailsType.isRequired,
  comments: commentsType.isRequired,
  descriptions: descriptionsType.isRequired,
  documents: documentsType.isRequired,
  histories: historiesType.isRequired,
  locations: locationsType.isRequired,
  riggings: riggingsType.isRequired,
  loading: PropTypes.bool
};

export default HydratedEntry;
